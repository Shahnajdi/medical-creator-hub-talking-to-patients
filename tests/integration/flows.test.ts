import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { closeDb, db, schema } from "@/db";
import { agencyLeadSchema, trainingLeadSchema } from "@/lib/crm/forms";
import { submitAgencyLead, submitTrainingLead } from "@/lib/crm/submit-lead";
import { sendTemplatedEmail } from "@/lib/email/messaging";
import { hasConsent, withdrawMarketing, isSuppressed } from "@/lib/consent";
import { runJobsOnce } from "@/lib/jobs/handlers";
import { enqueue } from "@/lib/jobs/queue";
import { getProvider } from "@/lib/payments/providers";
import { applyPaymentEvent, cancelSubscription, startCheckout } from "@/lib/payments/service";
import { hmac } from "@/lib/crypto";
import { erasePersonalData, exportPersonalData } from "@/lib/privacy/requests";
import { runRetention } from "@/lib/privacy/retention";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/auth/password";
import { listLeads } from "@/lib/crm/queries";

const ctx = { locale: "fa" as const, ipHash: "iphash", userAgent: "vitest" };
const agency = (over: Record<string, unknown> = {}) =>
  agencyLeadSchema.parse({
    fullName: "Sara Ahmadi", email: "Sara@Example.com", whatsapp: "+1 416 555 0100", country: "CA",
    businessName: "Sara Clinic", industry: "health", website: "saraclinic.ca", adStatus: "self_managed", objective: "leads", budget: "1500_5000",
    preferredContact: "email", acceptTerms: true, ageConfirm: true, ...over,
  });

async function reset() {
  await db().execute(sql`TRUNCATE contacts, companies, leads, opportunities, activities, tasks, consent_records, suppressions, jobs, message_log,
    tracking_events, audit_logs, orders, payments, payment_webhook_events, invoices, subscriptions, enrollments, products, product_prices, courses,
    users, sessions, privacy_requests, rate_limits, resources, resource_downloads CASCADE`);
}

beforeEach(reset);
afterAll(async () => { await reset(); await closeDb(); });

describe("agency funnel", () => {
  it("creates contact, company, scored lead, agency opportunity, consents and a workflow job", async () => {
    const r = await submitAgencyLead(agency(), ctx);
    const contact = await db().query.contacts.findFirst({ where: (c, { eq }) => eq(c.id, r.contactId) });
    expect(contact?.emailNormalized).toBe("sara@example.com");
    expect(contact?.phoneNormalized).toBe("+14165550100");
    const opp = await db().select({ key: schema.pipelines.key, stage: schema.pipelineStages.key }).from(schema.opportunities)
      .innerJoin(schema.pipelines, eq(schema.pipelines.id, schema.opportunities.pipelineId))
      .innerJoin(schema.pipelineStages, eq(schema.pipelineStages.id, schema.opportunities.stageId));
    expect(opp).toEqual([{ key: "agency", stage: "new" }]);
    const purposes = (await db().select().from(schema.consentRecords)).map((c) => c.purpose).sort();
    expect(purposes).toEqual(["age_confirmation", "privacy_notice", "terms"]); // no marketing without the box
    expect((await db().select().from(schema.jobs)).map((j) => j.type)).toEqual(["workflow.run"]);
  });

  it("deduplicates by normalised email/phone and keeps one open opportunity", async () => {
    await submitAgencyLead(agency(), ctx);
    await submitAgencyLead(agency({ email: " SARA@example.COM ", whatsapp: "001 416 555 0100" }), ctx);
    expect(await db().$count(schema.contacts)).toBe(1);
    expect(await db().$count(schema.leads)).toBe(2);
    expect(await db().$count(schema.opportunities)).toBe(1);
    expect(await db().$count(schema.companies)).toBe(1);
  });

  it("training leads go to the training pipeline, never the agency one", async () => {
    const [res] = await db().insert(schema.resources).values({ slug: "roadmap", funnel: "training", titleFa: "x", titleEn: "x", descriptionFa: "x", descriptionEn: "x", storageKey: "roadmap.pdf", status: "published" }).returning();
    const r = await submitTrainingLead(trainingLeadSchema.parse({ fullName: "Ali", email: "ali@example.com", country: "DE", acceptTerms: true, ageConfirm: true, marketingEmail: true }), ctx, res!.id);
    expect(r.downloadToken).toBeTruthy();
    const [p] = await db().select({ key: schema.pipelines.key }).from(schema.opportunities).innerJoin(schema.pipelines, eq(schema.pipelines.id, schema.opportunities.pipelineId));
    expect(p!.key).toBe("training");
    expect(await hasConsent(db(), r.contactId, "marketing_email")).toBe(true);
  });
});

describe("consent-aware messaging", () => {
  it("refuses marketing without consent, sends with consent, honours unsubscribe and suppression", async () => {
    const noon = new Date("2026-06-01T12:00:00Z");
    const a = await submitAgencyLead(agency(), ctx);
    expect(await sendTemplatedEmail({ contactId: a.contactId, template: "training_beginner_lesson", category: "marketing", now: noon })).toEqual({ status: "skipped", reason: "no_consent" });
    expect((await sendTemplatedEmail({ contactId: a.contactId, template: "agency_lead_confirmation", category: "transactional", now: noon })).status).toBe("sent");

    const b = await submitAgencyLead(agency({ email: "b@example.com", whatsapp: undefined, marketingEmail: true }), ctx);
    await db().update(schema.contacts).set({ timezone: "UTC" }).where(eq(schema.contacts.id, b.contactId));
    expect((await sendTemplatedEmail({ contactId: b.contactId, template: "training_beginner_lesson", category: "marketing", now: noon })).status).toBe("sent");
    // quiet hours (23:00 UTC) defer instead of sending
    expect((await sendTemplatedEmail({ contactId: b.contactId, template: "training_beginner_lesson", category: "marketing", now: new Date("2026-06-01T23:00:00Z") })).status).toBe("deferred");
    // weekly frequency cap (2)
    await sendTemplatedEmail({ contactId: b.contactId, template: "training_beginner_lesson", category: "marketing", now: noon });
    expect(await sendTemplatedEmail({ contactId: b.contactId, template: "training_beginner_lesson", category: "marketing", now: noon })).toEqual({ status: "skipped", reason: "frequency_cap" });

    await withdrawMarketing(db(), b.contactId, "test");
    expect(await hasConsent(db(), b.contactId, "marketing_email")).toBe(false);
    expect(await isSuppressed(db(), "b@example.com", "email")).toBe(true);
    // Re-ticking the box later does NOT bypass the suppression list
    await submitAgencyLead(agency({ email: "b@example.com", whatsapp: undefined, marketingEmail: true }), ctx);
    await db().execute(sql`DELETE FROM message_log`);
    expect(await sendTemplatedEmail({ contactId: b.contactId, template: "training_beginner_lesson", category: "marketing", now: noon })).toEqual({ status: "skipped", reason: "suppressed" });
  });
});

describe("job queue", () => {
  it("runs workflows idempotently and dead-letters after max attempts", async () => {
    await submitAgencyLead(agency(), ctx);
    await runJobsOnce(); // workflow.run → expands steps
    await runJobsOnce(); // steps
    expect(await db().$count(schema.tasks)).toBe(1);
    expect(await db().$count(schema.messageLog)).toBe(1); // confirmation email
    await enqueue(db(), { type: "nonexistent", payload: {}, idempotencyKey: "x", maxAttempts: 1 });
    await enqueue(db(), { type: "nonexistent", payload: {}, idempotencyKey: "x", maxAttempts: 1 }); // duplicate ignored
    await runJobsOnce();
    const dead = await db().select().from(schema.jobs).where(eq(schema.jobs.type, "nonexistent"));
    expect(dead).toHaveLength(1);
    expect(dead[0]!.status).toBe("dead");
  });
});

describe("payments", () => {
  async function setupProduct(interval: "one_time" | "month" = "one_time") {
    const [course] = await db().insert(schema.courses).values({ slug: "c1", titleFa: "دوره", titleEn: "Course", summaryFa: "x", summaryEn: "x", status: "published" }).returning();
    const [product] = await db().insert(schema.products).values({ slug: "p1", type: "course", nameFa: "دوره", nameEn: "Course", descriptionFa: "x", descriptionEn: "x", courseId: course!.id, billingInterval: interval, status: "published" }).returning();
    await db().insert(schema.productPrices).values({ productId: product!.id, currency: "USD", amountMinor: 19900 });
    const [user] = await db().insert(schema.users).values({ email: "buyer@example.com", name: "Buyer", passwordHash: await hashPassword("longpassword1") }).returning();
    return { course: course!, product: product!, user: user! };
  }
  const checkout = (userId: string, country = "CA") => startCheckout({ productSlug: "p1", currency: "USD", providerId: "mock", billingName: "Buyer", billingEmail: "buyer@example.com", billingCountry: country, userId, baseUrl: "http://x", locale: "en" });
  const signed = (body: object) => { const raw = JSON.stringify(body); return { raw, headers: new Headers({ "x-mock-signature": hmac(raw, "whsec_test") }) }; };

  it("takes the price from the database and grants access only after a verified webhook", async () => {
    const { user, course } = await setupProduct();
    const r = await checkout(user.id);
    if ("error" in r) throw new Error(r.error);
    expect(r.order.totalMinor).toBe(19900);
    expect(r.order.status).toBe("pending");
    const providerRef = r.session.providerRef;

    // forged signature is rejected
    const forged = JSON.stringify({ eventId: "e0", type: "payment.succeeded", providerRef, providerPaymentId: "p", amountMinor: 19900, currency: "USD" });
    expect(await getProvider("mock")!.verifyWebhook(forged, new Headers({ "x-mock-signature": "bad" }))).toBeNull();

    // amount mismatch is not marked paid
    const mm = signed({ eventId: "e1", type: "payment.succeeded", providerRef, providerPaymentId: "p1", amountMinor: 100, currency: "USD" });
    expect(await applyPaymentEvent("mock", (await getProvider("mock")!.verifyWebhook(mm.raw, mm.headers))!)).toBe("mismatch");

    const ok = signed({ eventId: "e2", type: "payment.succeeded", providerRef, providerPaymentId: "p2", amountMinor: 19900, currency: "USD" });
    const ev = (await getProvider("mock")!.verifyWebhook(ok.raw, ok.headers))!;
    expect(await applyPaymentEvent("mock", ev)).toBe("processed");
    expect(await applyPaymentEvent("mock", ev)).toBe("duplicate"); // idempotent
    await runJobsOnce();
    const order = await db().query.orders.findFirst({ where: (o, { eq }) => eq(o.id, r.order.id) });
    expect(order!.status).toBe("paid");
    expect(await db().$count(schema.payments)).toBe(1);
    expect(await db().$count(schema.invoices)).toBe(1);
    const enr = await db().query.enrollments.findFirst({ where: (e, { and, eq }) => and(eq(e.userId, user.id), eq(e.courseId, course.id)) });
    expect(enr?.status).toBe("active");
  });

  it("does not offer checkout where payment is not permitted", async () => {
    const { user } = await setupProduct();
    expect(await checkout(user.id, "IR")).toEqual({ error: "not_available_in_country" });
  });

  it("subscriptions can be cancelled by their owner only", async () => {
    const { user, product } = await setupProduct("month");
    const [sub] = await db().insert(schema.subscriptions).values({ userId: user.id, productId: product.id, provider: "mock", currentPeriodEnd: new Date(Date.now() + 86400_000) }).returning();
    const [other] = await db().insert(schema.users).values({ email: "o@example.com", name: "O", passwordHash: "x" }).returning();
    expect(await cancelSubscription(sub!.id, other!.id)).toBe(false);
    expect(await cancelSubscription(sub!.id, user.id)).toBe(true);
  });
});

describe("privacy rights", () => {
  it("exports and erases personal data, keeps orders unlinked, suppresses future marketing", async () => {
    const r = await submitAgencyLead(agency({ marketingEmail: true }), ctx);
    const [p] = await db().insert(schema.products).values({ slug: "px", type: "service", nameFa: "x", nameEn: "x", descriptionFa: "x", descriptionEn: "x" }).returning();
    const [price] = await db().insert(schema.productPrices).values({ productId: p!.id, currency: "EUR", amountMinor: 1000 }).returning();
    await db().insert(schema.orders).values({ contactId: r.contactId, productId: p!.id, priceId: price!.id, currency: "EUR", totalMinor: 1000, provider: "bank_transfer", termsVersion: "v", billingName: "Sara", billingEmail: "sara@example.com", billingCountry: "CA", status: "paid" });

    const exported = await exportPersonalData("sara@example.com");
    expect(exported!.contacts).toHaveLength(1);
    expect(exported!.leads).toHaveLength(1);
    expect(exported!.orders).toHaveLength(1);
    expect(exported!.consents.length).toBeGreaterThan(0);

    const [admin] = await db().insert(schema.users).values({ email: "admin@x.com", name: "A", passwordHash: "x", role: "admin" }).returning();
    await erasePersonalData("SARA@example.com", admin!.id);
    expect(await db().$count(schema.contacts)).toBe(0);
    expect(await db().$count(schema.leads)).toBe(0);
    expect(await db().$count(schema.consentRecords)).toBe(0);
    const [order] = await db().select().from(schema.orders);
    expect(order!.contactId).toBeNull(); // kept for tax law, unlinked
    expect(await isSuppressed(db(), "sara@example.com", "email")).toBe(true);
    expect((await db().select().from(schema.auditLogs)).some((a) => a.action === "privacy.erasure")).toBe(true);
  });
});

describe("retention", () => {
  it("deletes stale inactive leads but keeps customers", async () => {
    const stale = await submitAgencyLead(agency({ email: "old@example.com", whatsapp: undefined }), ctx);
    const kept = await submitAgencyLead(agency({ email: "cust@example.com", whatsapp: "+44 7700 900123" }), ctx);
    const old = new Date(Date.now() - 800 * 86400_000);
    await db().update(schema.contacts).set({ lastActivityAt: old });
    const [p] = await db().insert(schema.products).values({ slug: "py", type: "service", nameFa: "x", nameEn: "x", descriptionFa: "x", descriptionEn: "x" }).returning();
    const [price] = await db().insert(schema.productPrices).values({ productId: p!.id, currency: "EUR", amountMinor: 1 }).returning();
    await db().insert(schema.orders).values({ contactId: kept.contactId, productId: p!.id, priceId: price!.id, currency: "EUR", totalMinor: 1, provider: "bank_transfer", termsVersion: "v", billingName: "C", billingEmail: "cust@example.com", billingCountry: "GB" });
    const s = await runRetention();
    expect(s.contacts).toBe(1);
    expect(await db().query.contacts.findFirst({ where: (c, { eq }) => eq(c.id, stale.contactId) })).toBeUndefined();
    expect(await db().query.contacts.findFirst({ where: (c, { eq }) => eq(c.id, kept.contactId) })).toBeDefined();
  });
});

describe("access control & abuse protection", () => {
  it("sales agents only see leads assigned to them", async () => {
    const [agent1] = await db().insert(schema.users).values({ email: "a1@x.com", name: "A1", passwordHash: "x", role: "sales_agent" }).returning();
    await submitAgencyLead(agency(), ctx); // auto-assigned to the only agent
    const [agent2] = await db().insert(schema.users).values({ email: "a2@x.com", name: "A2", passwordHash: "x", role: "sales_agent" }).returning();
    const u = (x: typeof agent1) => ({ id: x!.id, email: x!.email, name: x!.name, role: x!.role, locale: "fa", timezone: "UTC" });
    expect(await listLeads(u(agent1), {})).toHaveLength(1);
    expect(await listLeads(u(agent2), {})).toHaveLength(0);
    expect(await listLeads({ ...u(agent2), role: "student" }, {})).toHaveLength(0);
  });
  it("rate limiter blocks after the limit", async () => {
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit("t:key", 3, 60));
    expect(results).toEqual([true, true, true, false]);
  });
  it("search input is parameterised (no SQL injection)", async () => {
    await submitAgencyLead(agency(), ctx);
    const admin = { id: "00000000-0000-0000-0000-000000000000", email: "x", name: "x", role: "admin" as const, locale: "fa", timezone: "UTC" };
    expect(await listLeads(admin, { q: "' OR 1=1; DROP TABLE contacts; --" })).toHaveLength(0);
    expect(await listLeads(admin, { q: "%" })).toHaveLength(0); // wildcard escaped
    expect(await db().$count(schema.contacts)).toBe(1);
  });
});
