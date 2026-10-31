import "server-only";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { schema, type DB, type Tx } from "@/db";
import { suppressionHash } from "@/lib/crypto";

type Purpose = (typeof schema.consentPurposeEnum.enumValues)[number];

export async function recordConsent(
  conn: DB | Tx,
  rec: {
    contactId?: string | null;
    userId?: string | null;
    visitorId?: string | null;
    purpose: Purpose;
    granted: boolean;
    documentVersion: string;
    source: string;
    locale?: string;
    ipHash?: string | null;
    userAgent?: string | null;
  },
) {
  await conn.insert(schema.consentRecords).values(rec);
}

/** Latest decision wins; a withdrawal is recorded as a new `granted=false` row. */
export async function hasConsent(conn: DB | Tx, contactId: string, purpose: Purpose): Promise<boolean> {
  const [row] = await conn
    .select({ granted: schema.consentRecords.granted })
    .from(schema.consentRecords)
    .where(
      and(
        eq(schema.consentRecords.contactId, contactId),
        eq(schema.consentRecords.purpose, purpose),
        isNull(schema.consentRecords.withdrawnAt),
      ),
    )
    .orderBy(desc(schema.consentRecords.createdAt))
    .limit(1);
  return row?.granted ?? false;
}

export async function withdrawMarketing(conn: DB | Tx, contactId: string, source: string) {
  const contact = await conn.query.contacts.findFirst({ where: (c, { eq }) => eq(c.id, contactId) });
  if (!contact) return;
  const now = new Date();
  for (const purpose of ["marketing_email", "marketing_whatsapp"] as const) {
    await conn
      .update(schema.consentRecords)
      .set({ withdrawnAt: now })
      .where(
        and(
          eq(schema.consentRecords.contactId, contactId),
          eq(schema.consentRecords.purpose, purpose),
          isNull(schema.consentRecords.withdrawnAt),
        ),
      );
    await recordConsent(conn, { contactId, purpose, granted: false, documentVersion: "withdrawal", source });
  }
  if (contact.emailNormalized) {
    await conn
      .insert(schema.suppressions)
      .values({ hash: suppressionHash(contact.emailNormalized), channel: "email", reason: source })
      .onConflictDoNothing();
  }
  if (contact.phoneNormalized) {
    await conn
      .insert(schema.suppressions)
      .values({ hash: suppressionHash(contact.phoneNormalized), channel: "whatsapp", reason: source })
      .onConflictDoNothing();
  }
  // Cancel any pending marketing jobs for this contact.
  await conn.execute(sql`
    UPDATE jobs SET status = 'cancelled'
    WHERE status = 'pending' AND payload->>'contactId' = ${contactId} AND payload->>'category' = 'marketing'`);
}

export async function isSuppressed(conn: DB | Tx, normalized: string, channel: "email" | "whatsapp") {
  const row = await conn.query.suppressions.findFirst({
    where: (s, { and, eq }) => and(eq(s.hash, suppressionHash(normalized)), eq(s.channel, channel)),
  });
  return Boolean(row);
}
