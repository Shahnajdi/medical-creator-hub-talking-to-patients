import "server-only";
import { env } from "@/lib/env";
import { hmac, safeEqual } from "@/lib/crypto";

export function unsubscribeToken(contactId: string) {
  return `${contactId}.${hmac(`unsub:${contactId}`)}`;
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [contactId, sig] = token.split(".");
  if (!contactId || !sig) return null;
  return safeEqual(sig, hmac(`unsub:${contactId}`)) ? contactId : null;
}

export function unsubscribeUrl(contactId: string, locale: string) {
  const base = env().APP_URL;
  const prefix = locale === "fa" ? "" : `/${locale}`;
  return `${base}${prefix}/unsubscribe?token=${encodeURIComponent(unsubscribeToken(contactId))}`;
}

export function oneClickUnsubscribeUrl(contactId: string) {
  return `${env().APP_URL}/api/unsubscribe?token=${encodeURIComponent(unsubscribeToken(contactId))}`;
}
