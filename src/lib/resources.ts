import "server-only";
import { hmac, safeEqual } from "@/lib/crypto";

const TTL_DAYS = 30;

/** Signed, expiring download token: resourceId.contactId.expiry.sig */
export function signDownload(resourceId: string, contactId: string, now = Date.now()) {
  const exp = Math.floor(now / 1000) + TTL_DAYS * 86400;
  const body = `${resourceId}.${contactId}.${exp}`;
  return `${body}.${hmac(`dl:${body}`)}`;
}

export function verifyDownload(token: string, now = Date.now()): { resourceId: string; contactId: string } | null {
  const parts = token.split(".");
  if (parts.length !== 4) return null;
  const [resourceId, contactId, exp, sig] = parts as [string, string, string, string];
  if (!safeEqual(sig, hmac(`dl:${resourceId}.${contactId}.${exp}`))) return null;
  if (Number(exp) * 1000 < now) return null;
  return { resourceId, contactId };
}
