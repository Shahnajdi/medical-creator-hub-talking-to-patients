import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { defaultFaqs, type FaqItem } from "@/content/home";

/** Only case studies with documented client permission are ever public. */
export async function publishedCaseStudies(limit?: number) {
  const q = db()
    .select()
    .from(schema.caseStudies)
    .where(and(eq(schema.caseStudies.status, "published"), eq(schema.caseStudies.clientPermission, true)))
    .orderBy(desc(schema.caseStudies.createdAt));
  return limit ? q.limit(limit) : q;
}

/** Only testimonials with granted, evidenced permission are ever public. */
export async function publishedTestimonials() {
  return db()
    .select()
    .from(schema.testimonials)
    .where(and(eq(schema.testimonials.status, "published"), eq(schema.testimonials.permissionStatus, "granted")))
    .orderBy(desc(schema.testimonials.createdAt));
}

export async function faqsByCategory(locale: "fa" | "en") {
  const rows = await db().select().from(schema.faqs).where(eq(schema.faqs.status, "published")).orderBy(asc(schema.faqs.position));
  if (!rows.length) return defaultFaqs[locale];
  const out: Record<string, { label: string; items: FaqItem[] }> = {};
  for (const r of rows) {
    const label = defaultFaqs[locale][r.category]?.label ?? r.category;
    (out[r.category] ??= { label, items: [] }).items.push({ q: locale === "fa" ? r.questionFa : r.questionEn, a: locale === "fa" ? r.answerFa : r.answerEn });
  }
  return out;
}

export type FounderVideo = { url: string; poster?: string; transcriptFa?: string; transcriptEn?: string };
export async function founderVideo(): Promise<FounderVideo | null> {
  const row = await db().query.settings.findFirst({ where: (s, { eq }) => eq(s.key, "home.founderVideo") });
  const v = row?.value as FounderVideo | undefined;
  return v?.url ? v : null;
}

export async function publishedResource(funnel: "agency" | "training") {
  return db().query.resources.findFirst({ where: (r, { and, eq, isNotNull }) => and(eq(r.funnel, funnel), eq(r.status, "published"), isNotNull(r.storageKey)) });
}

export async function publishedBlogPosts(locale: string) {
  return db()
    .select()
    .from(schema.blogPosts)
    .where(and(eq(schema.blogPosts.locale, locale), eq(schema.blogPosts.status, "published")))
    .orderBy(desc(schema.blogPosts.publishedAt));
}

export async function publishedCourses() {
  return db().select().from(schema.courses).where(eq(schema.courses.status, "published")).orderBy(desc(schema.courses.createdAt));
}
