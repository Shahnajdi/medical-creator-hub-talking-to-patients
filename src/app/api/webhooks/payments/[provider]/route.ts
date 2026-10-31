import { getProvider } from "@/lib/payments/providers";
import { applyPaymentEvent } from "@/lib/payments/service";
import { logger } from "@/lib/logger";

/**
 * Payment webhooks. Orders become "paid" ONLY here, after signature
 * verification — never from the browser's success redirect.
 */
export async function POST(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider: providerId } = await params;
  const provider = getProvider(providerId);
  if (!provider) return new Response("unknown provider", { status: 404 });
  const raw = await req.text();
  if (raw.length > 100_000) return new Response("too large", { status: 413 });
  const event = await provider.verifyWebhook(raw, req.headers);
  if (!event) {
    logger.warn("security.webhook_signature_invalid", { provider: providerId });
    return new Response("invalid signature", { status: 401 });
  }
  const result = await applyPaymentEvent(providerId, event);
  if (result === "mismatch") logger.warn("security.payment_amount_mismatch", { provider: providerId, eventId: event.eventId });
  return Response.json({ result });
}
