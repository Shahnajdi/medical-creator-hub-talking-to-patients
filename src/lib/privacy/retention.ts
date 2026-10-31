import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getSetting } from "@/lib/settings";
import { audit } from "@/lib/audit";
import type { RetentionConfig } from "./retention-config";

/**
 * Enforces data-retention limits. Run daily (`npm run retention` or the worker).
 * Inactive leads are only deleted when they have no account, no orders and no
 * upcoming appointment.
 */
export async function runRetention(now = new Date()) {
  const cfg = await getSetting<RetentionConfig>("privacy.retention");
  const conn = db();
  const days = (n: number) => new Date(now.getTime() - n * 86400_000).toISOString();
  const count = (r: unknown) => (r as { count?: number }).count ?? (Array.isArray(r) ? r.length : 0);

  const contacts = await conn.execute(sql`
    DELETE FROM contacts c
    WHERE c.last_activity_at < ${days(cfg.inactiveLeadDays)}
      AND NOT EXISTS (SELECT 1 FROM users u WHERE u.contact_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.contact_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM opportunities op WHERE op.contact_id = c.id AND op.status = 'won')
      AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.contact_id = c.id AND a.starts_at > ${now.toISOString()})
    RETURNING c.id`);
  const tracking = await conn.execute(sql`DELETE FROM tracking_events WHERE created_at < ${days(cfg.trackingEventDays)} RETURNING id`);
  const auditRows = await conn.execute(sql`DELETE FROM audit_logs WHERE created_at < ${days(cfg.auditLogDays)} RETURNING id`);
  const unverified = await conn.execute(sql`DELETE FROM privacy_requests WHERE status = 'unverified' AND created_at < ${days(cfg.unverifiedPrivacyRequestDays)} RETURNING id`);
  const closed = await conn.execute(sql`DELETE FROM privacy_requests WHERE status IN ('completed','rejected') AND completed_at < ${days(cfg.privacyRequestDays)} RETURNING id`);
  const messages = await conn.execute(sql`DELETE FROM message_log WHERE created_at < ${days(cfg.messageLogDays)} RETURNING id`);
  const jobs = await conn.execute(sql`DELETE FROM jobs WHERE status IN ('succeeded','cancelled','dead') AND created_at < ${days(cfg.finishedJobDays)} RETURNING id`);
  await conn.execute(sql`DELETE FROM sessions WHERE expires_at < ${now.toISOString()}`);
  await conn.execute(sql`DELETE FROM password_reset_tokens WHERE expires_at < ${now.toISOString()}`);
  await conn.execute(sql`DELETE FROM rate_limits WHERE window_start < ${days(2)}`);

  const summary = {
    contacts: count(contacts),
    trackingEvents: count(tracking),
    auditLogs: count(auditRows),
    privacyRequests: count(unverified) + count(closed),
    messageLog: count(messages),
    jobs: count(jobs),
  };
  await audit(conn, { action: "retention.run", entityType: "system", data: summary });
  return summary;
}
