import { z } from "zod";
import { db, schema } from "@/db";
import { hashIp } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";

const ALLOWED = [
  "page_view", "hero_cta_click", "agency_cta_click", "training_cta_click", "lead_magnet_view",
  "lead_form_start", "lead_form_submit", "resource_download", "appointment_booked", "checkout_started", "purchase", "course_enrolled",
] as const;

const str = z.string().max(300).optional();
const body = z.object({
  name: z.enum(ALLOWED),
  eventId: z.string().min(8).max(64),
  visitorId: z.string().uuid(),
  path: z.string().max(300),
  properties: z.record(z.string().max(40), z.union([z.string().max(200), z.number(), z.boolean()])).optional(),
  utm: z.object({ source: str, medium: str, campaign: str, content: str, term: str, referrer: str, landingPage: str }).partial().optional(),
});

/** First-party analytics. The client only calls this after analytics consent. */
export async function POST(req: Request) {
  const meta = await requestMeta();
  if (!(await rateLimit(`track:${hashIp(meta.ip)}`, 120, 60))) return new Response(null, { status: 429 });
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return new Response(null, { status: 400 });
  const d = parsed.data;
  await db()
    .insert(schema.trackingEvents)
    .values({ eventId: d.eventId, name: d.name, visitorId: d.visitorId, path: d.path, utm: d.utm, properties: d.properties })
    .onConflictDoNothing({ target: schema.trackingEvents.eventId });
  return new Response(null, { status: 204 });
}
