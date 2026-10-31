"use server";

import { z } from "zod";
import { db } from "@/db";
import { env } from "@/lib/env";
import { requireUser } from "@/lib/auth/session";
import { hashIp, hmac, randomToken } from "@/lib/crypto";
import { recordConsent } from "@/lib/consent";
import { LEGAL_VERSIONS } from "@/lib/legal/config";
import { CURRENCIES } from "@/lib/payments/types";
import { applyPaymentEvent, startCheckout } from "@/lib/payments/service";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";
import { COUNTRIES } from "@/lib/crm/forms";

const schemaIn = z.object({
  product: z.string().max(100),
  currency: z.enum(CURRENCIES as [string, ...string[]]),
  provider: z.string().max(40),
  billingName: z.string().trim().min(2).max(120),
  country: z.enum(COUNTRIES),
  acceptTerms: z.literal(true),
  acknowledgeRenewal: z.boolean().optional(),
});

export async function startCheckoutAction(locale: "fa" | "en", input: unknown): Promise<{ ok: true; redirect: string } | { ok: false; error: string }> {
  const user = await requireUser();
  const parsed = schemaIn.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const meta = await requestMeta();
  if (!(await rateLimit(`checkout:${user.id}`, 10, 3600))) return { ok: false, error: "rate_limited" };
  const d = parsed.data;
  const product = await db().query.products.findFirst({ where: (p, { eq }) => eq(p.slug, d.product) });
  if (product && product.billingInterval !== "one_time" && !d.acknowledgeRenewal) return { ok: false, error: "renewal_ack" };
  const res = await startCheckout({
    productSlug: d.product, currency: d.currency as never, providerId: d.provider, billingName: d.billingName, billingEmail: user.email,
    billingCountry: d.country, userId: user.id, baseUrl: env().APP_URL, locale,
  });
  if ("error" in res) return { ok: false, error: res.error! };
  await recordConsent(db(), { userId: user.id, purpose: "terms", granted: true, documentVersion: LEGAL_VERSIONS.terms, source: `checkout:${res.order.id}`, locale, ipHash: hashIp(meta.ip), userAgent: meta.userAgent });
  const prefix = locale === "fa" ? "" : "/en";
  if (res.session.kind === "redirect") return { ok: true, redirect: res.session.url.startsWith("/") ? `${prefix}${res.session.url}` : res.session.url };
  return { ok: true, redirect: `${prefix}/checkout/success?order=${res.order.id}` };
}

/**
 * DEVELOPMENT SANDBOX ONLY: simulates the provider calling our webhook, using
 * the exact same verification + idempotent apply path as a real provider.
 */
export async function simulateSandboxPayment(providerRef: string, outcome: "succeeded" | "failed") {
  const e = env();
  if (e.APP_ENV === "production" || !e.PAYMENT_PROVIDERS.includes("mock") || !e.MOCK_PAYMENT_WEBHOOK_SECRET) throw new Error("sandbox disabled");
  const user = await requireUser();
  const order = await db().query.orders.findFirst({ where: (o, { and, eq }) => and(eq(o.providerRef, providerRef), eq(o.provider, "mock")) });
  if (!order || order.userId !== user.id) throw new Error("not found");
  const body = JSON.stringify({ eventId: `evt_${randomToken(12)}`, type: `payment.${outcome}`, providerRef, providerPaymentId: `pay_${randomToken(10)}`, amountMinor: order.totalMinor, currency: order.currency });
  const { getProvider } = await import("@/lib/payments/providers");
  const verified = await getProvider("mock")!.verifyWebhook(body, new Headers({ "x-mock-signature": hmac(body, e.MOCK_PAYMENT_WEBHOOK_SECRET) }));
  if (!verified) throw new Error("signature");
  await applyPaymentEvent("mock", verified);
  // Fulfilment normally runs in the worker; run it inline in the sandbox for a smooth demo.
  const { runJobsOnce } = await import("@/lib/jobs/handlers");
  await runJobsOnce(5);
  return order.id;
}
