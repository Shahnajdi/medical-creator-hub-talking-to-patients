import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hmac(value: string, secret = env().APP_SECRET): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Keyed hash so raw IP addresses are never stored. */
export function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null;
  return hmac(`ip:${ip}`).slice(0, 32);
}

/** Stable hash used for the marketing suppression list. */
export function suppressionHash(normalized: string): string {
  return hmac(`suppress:${normalized}`);
}
