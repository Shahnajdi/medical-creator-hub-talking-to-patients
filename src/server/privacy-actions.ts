"use server";

import { z } from "zod";
import { db } from "@/db";
import { hashIp } from "@/lib/crypto";
import { withdrawMarketing } from "@/lib/consent";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { logger } from "@/lib/logger";
import { createPrivacyRequest } from "@/lib/privacy/requests";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";

const schema = z.object({
  type: z.enum(["access", "deletion", "correction", "objection"]),
  email: z.email().max(254),
  details: z.string().max(2000).optional(),
  hp: z.string().max(0).optional(),
});

export async function submitPrivacyRequest(locale: "fa" | "en", input: unknown): Promise<{ ok: boolean; error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const meta = await requestMeta();
  if (!(await rateLimit(`privacy:${hashIp(meta.ip)}`, 5, 3600))) return { ok: false, error: "rate_limited" };
  try {
    await createPrivacyRequest({ ...parsed.data, locale });
    return { ok: true };
  } catch (e) {
    logger.error("privacy_request.failed", { error: e instanceof Error ? e.message : String(e) });
    return { ok: false, error: "server" };
  }
}

export async function confirmUnsubscribe(token: string): Promise<{ ok: boolean }> {
  const contactId = verifyUnsubscribeToken(token);
  if (!contactId) return { ok: false };
  await withdrawMarketing(db(), contactId, "unsubscribe:page");
  return { ok: true };
}
