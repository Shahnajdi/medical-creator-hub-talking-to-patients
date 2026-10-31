import "server-only";
import { env } from "@/lib/env";
import { hmac, safeEqual } from "@/lib/crypto";
import type { PaymentProvider, VerifiedEvent } from "./types";

/**
 * DEVELOPMENT-ONLY sandbox provider. It simulates a hosted checkout page and
 * signs webhooks with MOCK_PAYMENT_WEBHOOK_SECRET. env() refuses to start in
 * production when it is enabled. No money moves.
 */
const mockProvider: PaymentProvider = {
  id: "mock",
  supportsRefunds: true,
  async createCheckout(order) {
    const ref = `mock_${order.id}`;
    return { kind: "redirect", providerRef: ref, url: `/checkout/sandbox?ref=${encodeURIComponent(ref)}` };
  },
  async verifyWebhook(rawBody, headers) {
    const secret = env().MOCK_PAYMENT_WEBHOOK_SECRET;
    const sig = headers.get("x-mock-signature");
    if (!secret || !sig) return null;
    if (!safeEqual(sig, hmac(rawBody, secret))) return null;
    try {
      const e = JSON.parse(rawBody) as VerifiedEvent;
      if (!e.eventId || !e.providerRef || typeof e.amountMinor !== "number") return null;
      return e;
    } catch {
      return null;
    }
  },
};

/** Manual bank transfer: shows instructions; an admin confirms receipt (audited). */
const bankTransferProvider: PaymentProvider = {
  id: "bank_transfer",
  supportsRefunds: false,
  async createCheckout(order) {
    return { kind: "instructions", providerRef: `bt_${order.id}` };
  },
  async verifyWebhook() {
    return null; // no webhooks; confirmations are manual
  },
};

const REGISTRY: Record<string, PaymentProvider> = { mock: mockProvider, bank_transfer: bankTransferProvider };

export function enabledProviders(): PaymentProvider[] {
  return env()
    .PAYMENT_PROVIDERS.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((id) => REGISTRY[id])
    .filter((p): p is PaymentProvider => Boolean(p));
}

export function getProvider(id: string): PaymentProvider | null {
  return enabledProviders().find((p) => p.id === id) ?? null;
}
