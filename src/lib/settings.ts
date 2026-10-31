import "server-only";
import { db, schema } from "@/db";
import { DEFAULT_SCORING } from "@/lib/crm/scoring-config";
import { DEFAULT_RETENTION } from "@/lib/privacy/retention-config";

const DEFAULTS: Record<string, unknown> = {
  "crm.scoring": DEFAULT_SCORING,
  "privacy.retention": DEFAULT_RETENTION,
  "messaging.limits": { marketingPerWeek: 2, quietHoursStart: 21, quietHoursEnd: 9 },
  "payments.eligibility": { blockedCountries: ["IR"], inquiryOnlyMessage: true },
};

export async function getSetting<T>(key: string): Promise<T> {
  const row = await db().query.settings.findFirst({ where: (s, { eq }) => eq(s.key, key) });
  if (row) return row.value as T;
  if (key in DEFAULTS) return DEFAULTS[key] as T;
  throw new Error(`Unknown setting ${key}`);
}

export async function setSetting(key: string, value: unknown, userId: string) {
  await db()
    .insert(schema.settings)
    .values({ key, value, updatedBy: userId })
    .onConflictDoUpdate({ target: schema.settings.key, set: { value, updatedBy: userId } });
}
