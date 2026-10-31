export type Currency = "TRY" | "USD" | "EUR" | "GBP" | "AUD";
export const CURRENCIES: Currency[] = ["TRY", "USD", "EUR", "GBP", "AUD"];
export const ZERO_DECIMAL: Currency[] = [];

export type CheckoutSession =
  | { kind: "redirect"; url: string; providerRef: string }
  | { kind: "instructions"; providerRef: string };

export type VerifiedEvent = {
  eventId: string;
  type: "payment.succeeded" | "payment.failed" | "payment.refunded";
  providerRef: string; // order reference we passed to the provider
  providerPaymentId: string;
  amountMinor: number;
  currency: string;
};

export interface PaymentProvider {
  id: string;
  /** Hosted checkout or instructions — card data never touches our servers. */
  createCheckout(order: { id: string; amountMinor: number; currency: Currency; description: string; email: string; returnUrl: string; cancelUrl: string }): Promise<CheckoutSession>;
  /** Verifies the webhook signature and returns a normalised event, or null when invalid. */
  verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedEvent | null>;
  supportsRefunds: boolean;
}

export function formatMoney(amountMinor: number, currency: string, locale: "fa" | "en") {
  return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US", { style: "currency", currency }).format(amountMinor / 100);
}
