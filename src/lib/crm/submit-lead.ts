import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db, schema, type Tx } from "@/db";
import { LEGAL_VERSIONS } from "@/lib/legal/config";
import { recordConsent } from "@/lib/consent";
import { enqueue } from "@/lib/jobs/queue";
import { getSetting } from "@/lib/settings";
import { randomToken } from "@/lib/crypto";
import { signDownload } from "@/lib/resources";
import { normalizeEmail, normalizePhone, normalizeUrl } from "./normalize";
import { scoreAgencyLead, type Qualification } from "./scoring";
import type { ScoringConfig } from "./scoring-config";
import { agencyLeadSchema, trainingLeadSchema } from "./forms";
import type { z } from "zod";

type AgencyData = z.output<typeof agencyLeadSchema>;
type TrainingData = z.output<typeof trainingLeadSchema>;

export type LeadContext = { locale: "fa" | "en"; ipHash: string | null; userAgent: string | null };

async function upsertContact(
  tx: Tx,
  d: { fullName: string; email?: string; whatsapp?: string; country: string; timezone?: string; utm?: schema.Utm },
  ctx: LeadContext,
  tag: string,
) {
  const emailN = normalizeEmail(d.email);
  const phoneN = normalizePhone(d.whatsapp);
  const conds = [];
  if (emailN) conds.push(eq(schema.contacts.emailNormalized, emailN));
  if (phoneN) conds.push(eq(schema.contacts.phoneNormalized, phoneN));
  // Lock matching rows so concurrent submissions for the same person serialise.
  const existing = await tx
    .select()
    .from(schema.contacts)
    .where(sql.join(conds, sql` OR `))
    .orderBy(asc(schema.contacts.createdAt))
    .for("update");

  const match = existing.find((c) => emailN && c.emailNormalized === emailN) ?? existing[0];
  if (match) {
    // Never blank existing data; only fill gaps. Don't steal a phone owned by another contact.
    const phoneOwnedElsewhere = existing.some((c) => c.id !== match.id && c.phoneNormalized === phoneN);
    const [updated] = await tx
      .update(schema.contacts)
      .set({
        fullName: d.fullName,
        email: match.email ?? d.email ?? null,
        emailNormalized: match.emailNormalized ?? emailN,
        whatsapp: match.whatsapp ?? (phoneOwnedElsewhere ? null : (d.whatsapp ?? null)),
        phoneNormalized: match.phoneNormalized ?? (phoneOwnedElsewhere ? null : phoneN),
        country: d.country,
        timezone: d.timezone ?? match.timezone,
        preferredLanguage: ctx.locale,
        tags: sql`(SELECT array_agg(DISTINCT t) FROM unnest(${schema.contacts.tags} || ARRAY[${tag}]::text[]) t)`,
        lastActivityAt: new Date(),
      })
      .where(eq(schema.contacts.id, match.id))
      .returning();
    return { contact: updated!, isNew: false };
  }
  const [created] = await tx
    .insert(schema.contacts)
    .values({
      fullName: d.fullName,
      email: d.email ?? null,
      emailNormalized: emailN,
      whatsapp: d.whatsapp ?? null,
      phoneNormalized: phoneN,
      country: d.country,
      timezone: d.timezone,
      preferredLanguage: ctx.locale,
      source: d.utm?.source ?? "website",
      utm: d.utm,
      tags: [tag],
    })
    .returning();
  return { contact: created!, isNew: true };
}

async function recordFormConsents(
  tx: Tx,
  contactId: string,
  d: { marketingEmail: boolean; marketingWhatsapp: boolean; email?: string; whatsapp?: string },
  ctx: LeadContext,
  source: string,
) {
  const base = { contactId, source, locale: ctx.locale, ipHash: ctx.ipHash, userAgent: ctx.userAgent };
  await recordConsent(tx, { ...base, purpose: "terms", granted: true, documentVersion: LEGAL_VERSIONS.terms });
  await recordConsent(tx, { ...base, purpose: "privacy_notice", granted: true, documentVersion: LEGAL_VERSIONS.privacy });
  await recordConsent(tx, { ...base, purpose: "age_confirmation", granted: true, documentVersion: LEGAL_VERSIONS.terms });
  // Marketing consent is separate and optional. Only record a grant when the
  // box was ticked AND a usable channel exists; never overwrite a previous
  // grant with an implicit "no" from an unticked box.
  if (d.marketingEmail && d.email) {
    await recordConsent(tx, { ...base, purpose: "marketing_email", granted: true, documentVersion: LEGAL_VERSIONS.marketing });
  }
  if (d.marketingWhatsapp && d.whatsapp) {
    await recordConsent(tx, { ...base, purpose: "marketing_whatsapp", granted: true, documentVersion: LEGAL_VERSIONS.marketing });
  }
}

async function pickOwner(tx: Tx): Promise<string | null> {
  // Least-loaded active sales agent (open leads assigned), then sales managers.
  const rows = await tx.execute<{ id: string }>(sql`
    SELECT u.id FROM users u
    LEFT JOIN opportunities o ON o.owner_user_id = u.id AND o.status = 'open'
    WHERE u.role IN ('sales_agent','sales_manager') AND u.disabled_at IS NULL
    GROUP BY u.id, u.role
    ORDER BY (u.role = 'sales_agent') DESC, count(o.id) ASC, u.id
    LIMIT 1`);
  return rows[0]?.id ?? null;
}

async function ensureOpportunity(
  tx: Tx,
  type: "agency" | "training",
  contactId: string,
  leadId: string,
  companyId: string | null,
  title: string,
  ownerUserId: string | null,
) {
  const pipeline = await tx.query.pipelines.findFirst({ where: (p, { eq }) => eq(p.key, type) });
  if (!pipeline) throw new Error(`Pipeline ${type} missing — run migrations`);
  const open = await tx.query.opportunities.findFirst({
    where: (o, { and, eq }) => and(eq(o.contactId, contactId), eq(o.pipelineId, pipeline.id), eq(o.status, "open")),
  });
  if (open) return { opportunityId: open.id, created: false };
  const stage = await tx.query.pipelineStages.findFirst({
    where: (s, { and, eq }) => and(eq(s.pipelineId, pipeline.id), eq(s.key, "new")),
  });
  const [opp] = await tx
    .insert(schema.opportunities)
    .values({ contactId, leadId, companyId, pipelineId: pipeline.id, stageId: stage!.id, title, ownerUserId })
    .returning({ id: schema.opportunities.id });
  return { opportunityId: opp!.id, created: true };
}

export type SubmitResult = { leadId: string; contactId: string; qualification: Qualification; downloadToken?: string };

export async function submitAgencyLead(d: AgencyData, ctx: LeadContext): Promise<SubmitResult> {
  const cfg = await getSetting<ScoringConfig>("crm.scoring");
  const website = normalizeUrl(d.website);
  return db().transaction(async (tx) => {
    const { contact } = await upsertContact(tx, d, ctx, "agency_interest");

    let company = await tx.query.companies.findFirst({
      where: (c, { and, eq }) => and(eq(c.ownerContactId, contact.id), sql`lower(${c.name}) = lower(${d.businessName})`),
    });
    if (!company) {
      [company] = await tx
        .insert(schema.companies)
        .values({ name: d.businessName, industry: d.industry, website, country: d.country, ownerContactId: contact.id })
        .returning();
    }

    const { score, qualification } = scoreAgencyLead({ ...d, website }, cfg);
    const ownerUserId = contact.ownerUserId ?? (await pickOwner(tx));
    if (ownerUserId && !contact.ownerUserId) {
      await tx.update(schema.contacts).set({ ownerUserId }).where(eq(schema.contacts.id, contact.id));
    }

    const [lead] = await tx
      .insert(schema.leads)
      .values({
        contactId: contact.id,
        companyId: company!.id,
        type: "agency",
        source: d.utm?.source ?? "website",
        answers: { adStatus: d.adStatus, objective: d.objective, budget: d.budget, preferredContact: d.preferredContact, industry: d.industry },
        score,
        qualification,
        assignedUserId: ownerUserId,
      })
      .returning({ id: schema.leads.id });

    await ensureOpportunity(tx, "agency", contact.id, lead!.id, company!.id, d.businessName, ownerUserId);
    await recordFormConsents(tx, contact.id, d, ctx, "form:free-audit");
    await tx.insert(schema.activities).values({
      contactId: contact.id,
      type: "form_submitted",
      description: "free-audit",
      metadata: { leadId: lead!.id, score, qualification },
    });
    await trackServer(tx, "lead_form_submit", d.eventId, contact.id, d.visitorId, d.utm, { funnel: "agency" });
    await enqueue(tx, {
      type: "workflow.run",
      payload: { event: "lead.created.agency", contactId: contact.id, leadId: lead!.id },
      idempotencyKey: `workflow:lead.created:${lead!.id}`,
    });
    return { leadId: lead!.id, contactId: contact.id, qualification };
  });
}

export async function submitTrainingLead(d: TrainingData, ctx: LeadContext, resourceId: string): Promise<SubmitResult> {
  return db().transaction(async (tx) => {
    const { contact } = await upsertContact(tx, d, ctx, "training_interest");
    const [lead] = await tx
      .insert(schema.leads)
      .values({ contactId: contact.id, type: "training", source: d.utm?.source ?? "website", qualification: "nurture" })
      .returning({ id: schema.leads.id });
    await ensureOpportunity(tx, "training", contact.id, lead!.id, null, d.fullName, null);
    await recordFormConsents(tx, contact.id, d, ctx, "form:free-meta-ads-guide");
    const downloadToken = signDownload(resourceId, contact.id);
    await tx.insert(schema.resourceDownloads).values({ resourceId, contactId: contact.id });
    await tx.insert(schema.activities).values({
      contactId: contact.id,
      type: "resource_requested",
      description: "free-meta-ads-guide",
      metadata: { leadId: lead!.id, resourceId },
    });
    await trackServer(tx, "lead_form_submit", d.eventId, contact.id, d.visitorId, d.utm, { funnel: "training" });
    await enqueue(tx, {
      type: "workflow.run",
      payload: { event: "lead.created.training", contactId: contact.id, leadId: lead!.id, resourceId },
      idempotencyKey: `workflow:lead.created:${lead!.id}`,
    });
    return { leadId: lead!.id, contactId: contact.id, qualification: "nurture", downloadToken };
  });
}

async function trackServer(
  tx: Tx,
  name: string,
  eventId: string | undefined,
  contactId: string,
  visitorId: string | undefined,
  utm: schema.Utm | undefined,
  properties: Record<string, string>,
) {
  await tx
    .insert(schema.trackingEvents)
    .values({ eventId: eventId || randomToken(16), name, contactId, visitorId, utm, properties })
    .onConflictDoNothing({ target: schema.trackingEvents.eventId });
}

// Exported for tests.
export const __test = { upsertContact, ensureOpportunity };
