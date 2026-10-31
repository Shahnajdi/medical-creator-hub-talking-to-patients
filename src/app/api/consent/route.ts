import { z } from "zod";
import { db } from "@/db";
import { recordConsent } from "@/lib/consent";
import { hashIp } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";

const body = z.object({ v: z.string().max(20), analytics: z.boolean(), marketing: z.boolean(), id: z.string().uuid() });

export async function POST(req: Request) {
  const meta = await requestMeta();
  const ipHash = hashIp(meta.ip);
  if (!(await rateLimit(`consent:${ipHash}`, 30, 3600))) return new Response(null, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const d = parsed.data;
  for (const [purpose, granted] of [["analytics_cookies", d.analytics], ["marketing_cookies", d.marketing]] as const) {
    await recordConsent(db(), { visitorId: d.id, purpose, granted, documentVersion: d.v, source: "cookie_banner", ipHash, userAgent: meta.userAgent });
  }
  return new Response(null, { status: 204 });
}
