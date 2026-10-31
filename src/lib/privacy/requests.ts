import "server-only";
import { and, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { audit } from "@/lib/audit";
import { env } from "@/lib/env";
import { randomToken, sha256, suppressionHash } from "@/lib/crypto";
import { normalizeEmail } from "@/lib/crm/normalize";
import { sendTransactionalTo } from "@/lib/email/messaging";
import { PRIVACY_REQUEST_SLA_DAYS } from "@/lib/legal/config";

type RequestType = (typeof schema.privacyRequestTypeEnum.enumValues)[number];

/**
 * Creates an unverified request and emails a verification link. The response
 * is identical whether or not we hold data for the address, so the endpoint
 * cannot be used to discover who is in the CRM.
 */
export async function createPrivacyRequest(input: { type: RequestType; email: string; details?: string; locale: "fa" | "en" }) {
  const email = normalizeEmail(input.email);
  if (!email) throw new Error("invalid email");
  const token = randomToken();
  await db()
    .insert(schema.privacyRequests)
    .values({ type: input.type, email, details: input.details?.slice(0, 2000), locale: input.locale, verificationTokenHash: sha256(token) });
  const prefix = input.locale === "fa" ? "" : `/${input.locale}`;
  await sendTransactionalTo(email, input.locale, "privacy_request_verify", {
    verifyUrl: `${env().APP_URL}${prefix}/privacy-request/verify?token=${encodeURIComponent(token)}`,
  });
}

export async function verifyPrivacyRequest(token: string): Promise<boolean> {
  const now = new Date();
  const rows = await db()
    .update(schema.privacyRequests)
    .set({
      status: "pending",
      verifiedAt: now,
      verificationTokenHash: null,
      dueAt: new Date(now.getTime() + PRIVACY_REQUEST_SLA_DAYS * 86400_000),
    })
    .where(and(eq(schema.privacyRequests.verificationTokenHash, sha256(token)), eq(schema.privacyRequests.status, "unverified")))
    .returning({ id: schema.privacyRequests.id });
  if (rows[0]) await audit(db(), { action: "privacy_request.verified", entityType: "privacy_request", entityId: rows[0].id });
  return rows.length > 0;
}

/** Everything we hold about an email address, as a portable JSON document. */
export async function exportPersonalData(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  if (!email) return null;
  const conn = db();
  const contacts = await conn.select().from(schema.contacts).where(eq(schema.contacts.emailNormalized, email));
  const users = await conn
    .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, locale: schema.users.locale, timezone: schema.users.timezone, createdAt: schema.users.createdAt })
    .from(schema.users)
    .where(sql`lower(${schema.users.email}) = ${email}`);
  const contactIds = contacts.map((c) => c.id);
  const userIds = users.map((u) => u.id);
  const inContacts = <T extends { contactId: unknown }>(t: T) => (contactIds.length ? inArray(t.contactId as never, contactIds) : sql`false`);

  const [leads, companies, consents, activities, appointments, tracking] = await Promise.all([
    conn.select().from(schema.leads).where(inContacts(schema.leads)),
    contactIds.length ? conn.select().from(schema.companies).where(inArray(schema.companies.ownerContactId, contactIds)) : [],
    conn.select().from(schema.consentRecords).where(inContacts(schema.consentRecords)),
    conn.select().from(schema.activities).where(inContacts(schema.activities)),
    conn.select().from(schema.appointments).where(inContacts(schema.appointments)),
    conn.select().from(schema.trackingEvents).where(inContacts(schema.trackingEvents)),
  ]);
  const orders = await conn
    .select()
    .from(schema.orders)
    .where(
      or(
        sql`lower(${schema.orders.billingEmail}) = ${email}`,
        userIds.length ? inArray(schema.orders.userId, userIds) : sql`false`,
      ),
    );
  const enrollments = userIds.length ? await conn.select().from(schema.enrollments).where(inArray(schema.enrollments.userId, userIds)) : [];

  // Strip internal-only fields (consent IP hashes are pseudonymous but kept out of the export noise).
  return {
    generatedAt: new Date().toISOString(),
    subject: email,
    contacts,
    accounts: users,
    leads,
    companies,
    consents: consents.map((c) => ({ ...c, ipHash: undefined })),
    activities,
    appointments,
    orders,
    enrollments,
    trackingEvents: tracking,
  };
}

/**
 * Erases personal data for an email address.
 *  - Contacts (and cascaded leads, activities, consents, appointments,
 *    conversations, tracking links) and user accounts are deleted.
 *  - Orders are retained because tax/commercial law requires it, but are
 *    unlinked from the deleted contact/account.
 *  - A keyed hash of the address is added to the suppression list so the
 *    person is never re-contacted with marketing (legitimate interest; the
 *    hash cannot be reversed into the address).
 */
export async function erasePersonalData(rawEmail: string, actorUserId: string, requestId?: string) {
  const email = normalizeEmail(rawEmail);
  if (!email) throw new Error("invalid email");
  return db().transaction(async (tx) => {
    const contacts = await tx.select().from(schema.contacts).where(eq(schema.contacts.emailNormalized, email));
    const users = await tx.select({ id: schema.users.id }).from(schema.users).where(sql`lower(${schema.users.email}) = ${email}`);
    const contactIds = contacts.map((c) => c.id);
    const userIds = users.map((u) => u.id);

    for (const c of contacts) {
      await tx.insert(schema.suppressions).values({ hash: suppressionHash(email), channel: "email", reason: "erasure" }).onConflictDoNothing();
      if (c.phoneNormalized) {
        await tx.insert(schema.suppressions).values({ hash: suppressionHash(c.phoneNormalized), channel: "whatsapp", reason: "erasure" }).onConflictDoNothing();
      }
    }
    if (contactIds.length) {
      await tx.delete(schema.trackingEvents).where(inArray(schema.trackingEvents.contactId, contactIds));
      await tx.delete(schema.companies).where(inArray(schema.companies.ownerContactId, contactIds));
      await tx.update(schema.orders).set({ contactId: null }).where(inArray(schema.orders.contactId, contactIds));
      await tx.execute(sql`UPDATE jobs SET status = 'cancelled' WHERE status = 'pending' AND payload->>'contactId' IN ${contactIds}`);
      await tx.delete(schema.contacts).where(inArray(schema.contacts.id, contactIds));
    }
    if (userIds.length) {
      await tx.update(schema.orders).set({ userId: null }).where(inArray(schema.orders.userId, userIds));
      await tx.update(schema.subscriptions).set({ status: "cancelled", cancelledAt: new Date() }).where(and(inArray(schema.subscriptions.userId, userIds), isNull(schema.subscriptions.cancelledAt)));
      await tx.delete(schema.users).where(inArray(schema.users.id, userIds));
    }
    await audit(tx, {
      actorUserId,
      action: "privacy.erasure",
      entityType: "privacy_request",
      entityId: requestId ?? null,
      data: { contacts: contactIds.length, accounts: userIds.length },
    });
    return { contacts: contactIds.length, accounts: userIds.length };
  });
}
