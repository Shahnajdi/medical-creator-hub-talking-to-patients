import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { business } from "@/lib/legal/config";
import { hasConsent, isSuppressed } from "@/lib/consent";
import { getSetting } from "@/lib/settings";
import { deliverEmail } from "./driver";
import { renderEmail, type Locale, type TemplateKey } from "./templates";
import { oneClickUnsubscribeUrl, unsubscribeUrl } from "./unsubscribe";

export type SendResult =
  | { status: "sent" }
  | { status: "skipped"; reason: string }
  | { status: "deferred"; until: Date };

type Limits = { marketingPerWeek: number; quietHoursStart: number; quietHoursEnd: number };

/** Hour (0–23) in the recipient's time zone; falls back to UTC. */
export function localHour(date: Date, timeZone: string | null | undefined): number {
  try {
    return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hourCycle: "h23", timeZone: timeZone || "UTC" }).format(date));
  } catch {
    return date.getUTCHours();
  }
}

export function inQuietHours(hour: number, start: number, end: number) {
  return start > end ? hour >= start || hour < end : hour >= start && hour < end;
}

/**
 * Sends a templated email to a contact, enforcing:
 *  - marketing requires recorded, non-withdrawn marketing_email consent
 *  - suppression list (unsubscribes, deletion requests)
 *  - weekly frequency cap and recipient-local quiet hours for marketing
 *  - commercial emails require a postal address + unsubscribe link (CAN-SPAM etc.)
 */
export async function sendTemplatedEmail(params: {
  contactId: string;
  template: TemplateKey;
  category: "transactional" | "marketing";
  vars?: Record<string, string | undefined>;
  now?: Date;
}): Promise<SendResult> {
  const conn = db();
  const now = params.now ?? new Date();
  const contact = await conn.query.contacts.findFirst({ where: (c, { eq }) => eq(c.id, params.contactId) });
  if (!contact) return { status: "skipped", reason: "contact_not_found" };
  if (!contact.email || !contact.emailNormalized) return { status: "skipped", reason: "no_email" };
  const locale: Locale = contact.preferredLanguage === "en" ? "en" : "fa";
  const marketing = params.category === "marketing";

  if (marketing) {
    if (!business.address) return { status: "skipped", reason: "missing_postal_address" };
    if (!(await hasConsent(conn, contact.id, "marketing_email"))) return { status: "skipped", reason: "no_consent" };
    if (await isSuppressed(conn, contact.emailNormalized, "email")) return { status: "skipped", reason: "suppressed" };

    const limits = await getSetting<Limits>("messaging.limits");
    const hour = localHour(now, contact.timezone);
    if (inQuietHours(hour, limits.quietHoursStart, limits.quietHoursEnd)) {
      return { status: "deferred", until: new Date(now.getTime() + 60 * 60_000) };
    }
    const weekAgo = new Date(now.getTime() - 7 * 86400_000);
    const [{ count } = { count: 0 }] = await conn
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.messageLog)
      .where(
        and(
          eq(schema.messageLog.contactId, contact.id),
          eq(schema.messageLog.category, "marketing"),
          eq(schema.messageLog.status, "sent"),
          gte(schema.messageLog.createdAt, weekAgo),
        ),
      );
    if (count >= limits.marketingPerWeek) return { status: "skipped", reason: "frequency_cap" };
  }

  const unsub = unsubscribeUrl(contact.id, locale);
  const rendered = renderEmail(params.template, locale, { name: contact.fullName, ...params.vars }, { marketing, unsubscribeUrl: marketing ? unsub : undefined });
  const headers: Record<string, string> = {};
  if (marketing) {
    // RFC 8058 one-click unsubscribe (required by Gmail/Yahoo bulk sender rules).
    headers["List-Unsubscribe"] = `<${oneClickUnsubscribeUrl(contact.id)}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  const { providerRef } = await deliverEmail({ to: contact.email, ...rendered, headers });
  await conn.insert(schema.messageLog).values({
    contactId: contact.id,
    channel: "email",
    template: params.template,
    category: params.category,
    status: "sent",
    providerRef,
  });
  await conn.insert(schema.activities).values({
    contactId: contact.id,
    type: "email_sent",
    description: `${params.template} (${params.category})`,
  });
  return { status: "sent" };
}

/** Sends to an arbitrary address (no contact) — only for transactional, user-initiated mail. */
export async function sendTransactionalTo(to: string, locale: Locale, template: TemplateKey, vars: Record<string, string | undefined>) {
  const rendered = renderEmail(template, locale, vars, { marketing: false });
  return deliverEmail({ to, ...rendered });
}
