import "server-only";
import { headers } from "next/headers";

/**
 * Client IP for rate limiting / hashing. The LEFTMOST X-Forwarded-For entry is
 * client-controlled and spoofable, so we take the entry added by our own
 * proxy chain: TRUSTED_PROXY_HOPS (default 1) entries from the right.
 */
export function clientIpFrom(xff: string | null, realIp: string | null, hops = Number(process.env.TRUSTED_PROXY_HOPS ?? 1)): string | null {
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    const ip = parts[Math.max(0, parts.length - hops)];
    if (ip) return ip;
  }
  return realIp;
}

export async function requestMeta() {
  const h = await headers();
  return { ip: clientIpFrom(h.get("x-forwarded-for"), h.get("x-real-ip")), userAgent: h.get("user-agent")?.slice(0, 300) ?? null };
}
