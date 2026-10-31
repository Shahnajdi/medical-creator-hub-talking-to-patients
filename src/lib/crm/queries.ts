import "server-only";
import { and, desc, eq, gte, ilike, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import type { SessionUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";

/** Row-level scoping: sales agents only ever see contacts they own. */
export function contactScope(user: SessionUser): SQL | undefined {
  if (can(user.role, "crm.read_all")) return undefined;
  if (can(user.role, "crm.read_assigned")) return eq(schema.contacts.ownerUserId, user.id);
  return sql`false`;
}

export async function listLeads(user: SessionUser, f: { q?: string; type?: "agency" | "training"; qualification?: string; limit?: number }) {
  const conds = [contactScope(user)];
  if (f.type) conds.push(eq(schema.leads.type, f.type));
  if (f.qualification) conds.push(eq(schema.leads.qualification, f.qualification as never));
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (m) => `\\${m}`)}%`;
    conds.push(or(ilike(schema.contacts.fullName, like), ilike(schema.contacts.email, like), ilike(schema.contacts.whatsapp, like)));
  }
  return db()
    .select({
      id: schema.leads.id,
      type: schema.leads.type,
      score: schema.leads.score,
      qualification: schema.leads.qualification,
      source: schema.leads.source,
      createdAt: schema.leads.createdAt,
      contactId: schema.contacts.id,
      name: schema.contacts.fullName,
      email: schema.contacts.email,
      whatsapp: schema.contacts.whatsapp,
      country: schema.contacts.country,
      company: schema.companies.name,
    })
    .from(schema.leads)
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.leads.contactId))
    .leftJoin(schema.companies, eq(schema.companies.id, schema.leads.companyId))
    .where(and(...conds))
    .orderBy(desc(schema.leads.createdAt))
    .limit(f.limit ?? 200);
}

export async function getContactForUser(user: SessionUser, id: string) {
  const [contact] = await db().select().from(schema.contacts).where(and(eq(schema.contacts.id, id), contactScope(user)));
  if (!contact) return null;
  const [leads, activities, consents, opps, tasks, appts] = await Promise.all([
    db().select().from(schema.leads).where(eq(schema.leads.contactId, id)).orderBy(desc(schema.leads.createdAt)),
    db().select().from(schema.activities).where(eq(schema.activities.contactId, id)).orderBy(desc(schema.activities.createdAt)).limit(200),
    db().select().from(schema.consentRecords).where(eq(schema.consentRecords.contactId, id)).orderBy(desc(schema.consentRecords.createdAt)),
    db()
      .select({ id: schema.opportunities.id, title: schema.opportunities.title, status: schema.opportunities.status, stageFa: schema.pipelineStages.nameFa, stageEn: schema.pipelineStages.nameEn, pipeline: schema.pipelines.key })
      .from(schema.opportunities)
      .innerJoin(schema.pipelineStages, eq(schema.pipelineStages.id, schema.opportunities.stageId))
      .innerJoin(schema.pipelines, eq(schema.pipelines.id, schema.opportunities.pipelineId))
      .where(eq(schema.opportunities.contactId, id)),
    db().select().from(schema.tasks).where(eq(schema.tasks.contactId, id)).orderBy(desc(schema.tasks.createdAt)),
    db().select().from(schema.appointments).where(eq(schema.appointments.contactId, id)).orderBy(desc(schema.appointments.startsAt)),
  ]);
  return { contact, leads, activities, consents, opps, tasks, appts };
}

export async function pipelineBoard(user: SessionUser, key: "agency" | "training") {
  const pipeline = await db().query.pipelines.findFirst({ where: (p, { eq }) => eq(p.key, key) });
  if (!pipeline) return null;
  const stages = await db().query.pipelineStages.findMany({ where: (s, { eq }) => eq(s.pipelineId, pipeline.id), orderBy: (s, { asc }) => asc(s.position) });
  const opps = await db()
    .select({ id: schema.opportunities.id, title: schema.opportunities.title, stageId: schema.opportunities.stageId, contactId: schema.contacts.id, name: schema.contacts.fullName, country: schema.contacts.country, updatedAt: schema.opportunities.updatedAt })
    .from(schema.opportunities)
    .innerJoin(schema.contacts, eq(schema.contacts.id, schema.opportunities.contactId))
    .where(and(eq(schema.opportunities.pipelineId, pipeline.id), contactScope(user)))
    .orderBy(desc(schema.opportunities.updatedAt))
    .limit(500);
  return { pipeline, stages, opps };
}

/** Overview metrics computed from the database only. */
export async function overviewMetrics(days: number) {
  const since = new Date(Date.now() - days * 86400_000);
  const c = (q: Promise<{ n: number }[]>) => q.then((r) => Number(r[0]?.n ?? 0));
  const n = sql<number>`count(*)::int`;
  const [totalLeads, agencyLeads, trainingLeads, qualified, appointments, won, enrollments, tasksDue, failedJobs, revenue] = await Promise.all([
    c(db().select({ n }).from(schema.leads).where(gte(schema.leads.createdAt, since))),
    c(db().select({ n }).from(schema.leads).where(and(gte(schema.leads.createdAt, since), eq(schema.leads.type, "agency")))),
    c(db().select({ n }).from(schema.leads).where(and(gte(schema.leads.createdAt, since), eq(schema.leads.type, "training")))),
    c(db().select({ n }).from(schema.leads).where(and(gte(schema.leads.createdAt, since), sql`${schema.leads.qualification} IN ('high','medium')`))),
    c(db().select({ n }).from(schema.appointments).where(and(gte(schema.appointments.createdAt, since), eq(schema.appointments.status, "booked")))),
    c(db().select({ n }).from(schema.opportunities).where(and(gte(schema.opportunities.updatedAt, since), eq(schema.opportunities.status, "won")))),
    c(db().select({ n }).from(schema.enrollments).where(gte(schema.enrollments.enrolledAt, since))),
    c(db().select({ n }).from(schema.tasks).where(and(eq(schema.tasks.status, "open"), sql`${schema.tasks.dueAt} < now() + interval '1 day'`))),
    c(db().select({ n }).from(schema.jobs).where(eq(schema.jobs.status, "dead"))),
    // Revenue is reported PER CURRENCY — never summed across currencies.
    db().select({ currency: schema.orders.currency, total: sql<number>`sum(${schema.orders.totalMinor})::bigint` }).from(schema.orders).where(and(eq(schema.orders.status, "paid"), gte(schema.orders.createdAt, since))).groupBy(schema.orders.currency),
  ]);
  const sources = await db()
    .select({ source: sql<string>`coalesce(${schema.leads.source}, 'unknown')`, n })
    .from(schema.leads)
    .where(gte(schema.leads.createdAt, since))
    .groupBy(sql`1`)
    .orderBy(sql`2 desc`)
    .limit(8);
  return { totalLeads, agencyLeads, trainingLeads, qualified, appointments, won, enrollments, tasksDue, failedJobs, revenue, sources };
}
