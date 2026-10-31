/**
 * Default retention limits in days (settings key "privacy.retention").
 * Review these with your legal adviser; tax law usually requires keeping
 * invoices/orders for a statutory period (Turkey: generally 10 years under VUK/TTK),
 * which is why orders are not purged here.
 */
export type RetentionConfig = {
  /** Leads with no activity, no order and no account are deleted after this. */
  inactiveLeadDays: number;
  /** Raw first-party tracking events. */
  trackingEventDays: number;
  /** Audit logs. */
  auditLogDays: number;
  /** Completed/rejected privacy requests (kept as evidence of handling). */
  privacyRequestDays: number;
  /** Unverified privacy requests. */
  unverifiedPrivacyRequestDays: number;
  /** Outbound message log. */
  messageLogDays: number;
  /** Finished background jobs. */
  finishedJobDays: number;
};

export const DEFAULT_RETENTION: RetentionConfig = {
  inactiveLeadDays: 730,
  trackingEventDays: 395,
  auditLogDays: 730,
  privacyRequestDays: 1095,
  unverifiedPrivacyRequestDays: 7,
  messageLogDays: 395,
  finishedJobDays: 30,
};
