"use server";

import { agencyLeadSchema, trainingLeadSchema } from "@/lib/crm/forms";
import { submitAgencyLead, submitTrainingLead } from "@/lib/crm/submit-lead";
import { publishedResource } from "@/lib/content";
import { hashIp } from "@/lib/crypto";
import { normalizeEmail } from "@/lib/crm/normalize";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";

export type ActionResult =
  | { ok: true; qualification?: string; downloadToken?: string }
  | { ok: false; fieldErrors?: Record<string, string>; formError?: string };

function fieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) {
    const k = String(i.path[0] ?? "_form");
    out[k] ??= i.message;
  }
  return out;
}

async function guard(email: string | undefined) {
  const meta = await requestMeta();
  const ipHash = hashIp(meta.ip);
  const okIp = await rateLimit(`lead:ip:${ipHash ?? "unknown"}`, 8, 600);
  const e = normalizeEmail(email);
  const okEmail = e ? await rateLimit(`lead:email:${e}`, 4, 3600) : true;
  if (!okIp || !okEmail) logger.warn("security.rate_limited", { scope: "lead_form", ipHash });
  return { ok: okIp && okEmail, ipHash, userAgent: meta.userAgent };
}

export async function submitAgencyLeadAction(locale: "fa" | "en", input: unknown): Promise<ActionResult> {
  const parsed = agencyLeadSchema.safeParse(input);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error.issues);
    if (errors.hp) {
      logger.warn("security.honeypot", { form: "agency" });
      return { ok: false, formError: "spam" };
    }
    return { ok: false, fieldErrors: errors };
  }
  const g = await guard(parsed.data.email);
  if (!g.ok) return { ok: false, formError: "rate_limited" };
  try {
    const r = await submitAgencyLead(parsed.data, { locale, ipHash: g.ipHash, userAgent: g.userAgent });
    return { ok: true, qualification: r.qualification };
  } catch (err) {
    logger.error("lead.agency_failed", { error: err instanceof Error ? err.message : String(err) });
    return { ok: false, formError: "server" };
  }
}

export async function submitTrainingLeadAction(locale: "fa" | "en", input: unknown): Promise<ActionResult> {
  const parsed = trainingLeadSchema.safeParse(input);
  if (!parsed.success) {
    const errors = fieldErrors(parsed.error.issues);
    if (errors.hp) return { ok: false, formError: "spam" };
    return { ok: false, fieldErrors: errors };
  }
  const resource = await publishedResource("training");
  if (!resource) return { ok: false, formError: "server" }; // never collect data for a resource we cannot deliver
  const g = await guard(parsed.data.email);
  if (!g.ok) return { ok: false, formError: "rate_limited" };
  try {
    const r = await submitTrainingLead(parsed.data, { locale, ipHash: g.ipHash, userAgent: g.userAgent }, resource.id);
    return { ok: true, downloadToken: r.downloadToken };
  } catch (err) {
    logger.error("lead.training_failed", { error: err instanceof Error ? err.message : String(err) });
    return { ok: false, formError: "server" };
  }
}
