import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { audit } from "@/lib/audit";
import { enqueue } from "@/lib/jobs/queue";
import { LEGAL_VERSIONS } from "@/lib/legal/config";
import { getSetting } from "@/lib/settings";
import { getProvider } from "./providers";
import type { Currency, VerifiedEvent } from "./types";

export type Eligibility = { blockedCountries: string[]; inquiryOnlyMessage: boolean };

export async function isCheckoutAvailable(country: string) {
  const e = await getSetting<Eligibility>("payments.eligibility");
  return !e.blockedCountries.includes(country.toUpperCase());
}

/**
 * Creates an order. The price is ALWAYS read from the database — the client
 * only sends product slug + currency — so prices cannot be tampered with.
 */
export async function startCheckout(input: {
  productSlug: string;
  currency: Currency;
  providerId: string;
  billingName: string;
  billingEmail: string;
  billingCountry: string;
  userId: string | null;
  baseUrl: string;
  locale: "fa" | "en";
}) {
  if (!(await isCheckoutAvailable(input.billingCountry))) return { error: "not_available_in_country" as const };
  const provider = getProvider(input.providerId);
  if (!provider) return { error: "provider_unavailable" as const };
  const product = await db().query.products.findFirst({
    where: (p, { and, eq }) => and(eq(p.slug, input.productSlug), eq(p.status, "published")),
  });
  if (!product) return { error: "product_not_found" as const };
  const price = await db().query.productPrices.findFirst({
    where: (pp, { and, eq }) => and(eq(pp.productId, product.id), eq(pp.currency, input.currency), eq(pp.active, true)),
  });
  if (!price) return { error: "price_not_found" as const };

  const [order] = await db()
    .insert(schema.orders)
    .values({
      userId: input.userId,
      productId: product.id,
      priceId: price.id,
      currency: price.currency,
      totalMinor: price.amountMinor,
      provider: provider.id,
      status: provider.id === "bank_transfer" ? "awaiting_transfer" : "pending",
      termsVersion: LEGAL_VERSIONS.terms,
      billingName: input.billingName,
      billingEmail: input.billingEmail,
      billingCountry: input.billingCountry,
    })
    .returning();
  const prefix = input.locale === "fa" ? "" : `/${input.locale}`;
  const session = await provider.createCheckout({
    id: order!.id,
    amountMinor: price.amountMinor,
    currency: price.currency as Currency,
    description: input.locale === "fa" ? product.nameFa : product.nameEn,
    email: input.billingEmail,
    returnUrl: `${input.baseUrl}${prefix}/checkout/success?order=${order!.id}`,
    cancelUrl: `${input.baseUrl}${prefix}/checkout/cancel?order=${order!.id}`,
  });
  await db().update(schema.orders).set({ providerRef: session.providerRef }).where(eq(schema.orders.id, order!.id));
  await audit(db(), { actorUserId: input.userId, action: "order.created", entityType: "order", entityId: order!.id, data: { provider: provider.id, total: price.amountMinor, currency: price.currency } });
  return { order: order!, session };
}

/**
 * Applies a VERIFIED provider event. Idempotent: duplicate deliveries are
 * ignored via the unique (provider, event_id) constraint. An order is only
 * marked paid when the amount and currency match what we charged.
 */
export async function applyPaymentEvent(providerId: string, e: VerifiedEvent): Promise<"processed" | "duplicate" | "mismatch" | "unknown_order"> {
  return db().transaction(async (tx) => {
    const inserted = await tx
      .insert(schema.paymentWebhookEvents)
      .values({ provider: providerId, eventId: e.eventId, type: e.type })
      .onConflictDoNothing()
      .returning({ id: schema.paymentWebhookEvents.id });
    if (!inserted.length) return "duplicate";

    const [order] = await tx
      .select()
      .from(schema.orders)
      .where(and(eq(schema.orders.provider, providerId), eq(schema.orders.providerRef, e.providerRef)))
      .for("update");
    if (!order) return "unknown_order";

    if (e.type === "payment.succeeded") {
      if (order.totalMinor !== e.amountMinor || order.currency !== e.currency) {
        await audit(tx, { action: "payment.amount_mismatch", entityType: "order", entityId: order.id, data: { expected: order.totalMinor, got: e.amountMinor, currency: e.currency } });
        return "mismatch";
      }
      await tx.insert(schema.payments).values({ orderId: order.id, provider: providerId, providerPaymentId: e.providerPaymentId, amountMinor: e.amountMinor, currency: e.currency, status: "succeeded" }).onConflictDoNothing();
      if (order.status !== "paid") {
        await tx.update(schema.orders).set({ status: "paid" }).where(eq(schema.orders.id, order.id));
        const year = new Date().getUTCFullYear();
        const [{ n } = { n: 1 }] = await tx.execute<{ n: number }>(sql`SELECT count(*)::int + 1 AS n FROM invoices WHERE number LIKE ${`NT-${year}-%`}`);
        await tx.insert(schema.invoices).values({ orderId: order.id, number: `NT-${year}-${String(n).padStart(5, "0")}` });
        await enqueue(tx, { type: "order.fulfil", payload: { orderId: order.id }, idempotencyKey: `fulfil:${order.id}` });
      }
    } else if (e.type === "payment.failed") {
      if (order.status === "pending") await tx.update(schema.orders).set({ status: "failed" }).where(eq(schema.orders.id, order.id));
    } else if (e.type === "payment.refunded") {
      await tx.update(schema.orders).set({ status: "refunded" }).where(eq(schema.orders.id, order.id));
      await tx.update(schema.enrollments).set({ status: "revoked" }).where(eq(schema.enrollments.orderId, order.id));
    }
    await audit(tx, { action: e.type, entityType: "order", entityId: order.id, data: { provider: providerId, eventId: e.eventId } });
    return "processed";
  });
}

/** Grants course access / creates subscription after payment. */
export async function fulfilOrder(orderId: string) {
  await db().transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({ where: (o, { eq }) => eq(o.id, orderId) });
    if (!order || order.status !== "paid" || !order.userId) return;
    const product = await tx.query.products.findFirst({ where: (p, { eq }) => eq(p.id, order.productId) });
    if (!product) return;
    if (product.courseId) {
      await tx
        .insert(schema.enrollments)
        .values({ userId: order.userId, courseId: product.courseId, orderId: order.id })
        .onConflictDoUpdate({ target: [schema.enrollments.userId, schema.enrollments.courseId], set: { status: "active", orderId: order.id } });
    }
    if (product.billingInterval !== "one_time") {
      const end = new Date();
      if (product.billingInterval === "month") end.setUTCMonth(end.getUTCMonth() + 1);
      else end.setUTCFullYear(end.getUTCFullYear() + 1);
      await tx.insert(schema.subscriptions).values({ userId: order.userId, productId: product.id, orderId: order.id, provider: order.provider, currentPeriodEnd: end });
    }
  });
}

/** One-click cancellation: stops renewal at period end; no retention gates. */
export async function cancelSubscription(subscriptionId: string, userId: string) {
  const rows = await db()
    .update(schema.subscriptions)
    .set({ cancelAtPeriodEnd: true, cancelledAt: new Date() })
    .where(and(eq(schema.subscriptions.id, subscriptionId), eq(schema.subscriptions.userId, userId), eq(schema.subscriptions.status, "active")))
    .returning({ id: schema.subscriptions.id });
  if (rows.length) await audit(db(), { actorUserId: userId, action: "subscription.cancelled", entityType: "subscription", entityId: subscriptionId });
  return rows.length > 0;
}
