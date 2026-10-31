"use server";

import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db, schema } from "@/db";
import { audit } from "@/lib/audit";
import { createSession, destroySession } from "@/lib/auth/session";
import { hashPassword, PASSWORD_MIN_LENGTH, verifyPassword } from "@/lib/auth/password";
import { hashIp, randomToken, sha256 } from "@/lib/crypto";
import { env } from "@/lib/env";
import { LEGAL_VERSIONS } from "@/lib/legal/config";
import { recordConsent } from "@/lib/consent";
import { logger } from "@/lib/logger";
import { rateLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/request-meta";
import { sendTransactionalTo } from "@/lib/email/messaging";

export type AuthResult = { ok: boolean; error?: string };

// A fixed dummy hash so login takes the same time whether or not the user exists.
const DUMMY_HASH = "scrypt$32768$8$1$AAAAAAAAAAAAAAAAAAAAAA$" + "A".repeat(86);

/** Only allow same-site relative redirects (prevents open redirects). */
function safeNext(next: unknown, fallback: string) {
  return typeof next === "string" && /^\/(?!\/)[\w\-/]*$/.test(next) ? next : fallback;
}

const loginSchema = z.object({ email: z.email().max(254), password: z.string().min(1).max(200), next: z.string().max(200).optional() });

export async function loginAction(_prev: AuthResult, form: FormData): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: "invalid" };
  const meta = await requestMeta();
  const ipHash = hashIp(meta.ip);
  const email = parsed.data.email.toLowerCase();
  const allowed = (await rateLimit(`login:ip:${ipHash}`, 20, 900)) && (await rateLimit(`login:email:${email}`, 8, 900));
  if (!allowed) {
    logger.warn("security.login_rate_limited", { ipHash });
    return { ok: false, error: "rate_limited" };
  }
  const user = await db().query.users.findFirst({ where: (u, { and, isNull }) => and(sql`lower(${u.email}) = ${email}`, isNull(u.disabledAt)) });
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) {
    logger.warn("security.login_failed", { ipHash });
    await audit(db(), { action: "auth.login_failed", entityType: "user", entityId: user?.id ?? null, data: { ipHash } });
    return { ok: false, error: "invalid" };
  }
  await createSession(user.id, meta.userAgent);
  await audit(db(), { actorUserId: user.id, action: "auth.login", entityType: "user", entityId: user.id });
  const staff = !["student", "agency_customer"].includes(user.role);
  redirect(safeNext(parsed.data.next, staff ? "/admin" : "/dashboard"));
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.email().max(254),
  password: z.string().min(PASSWORD_MIN_LENGTH).max(200),
  acceptTerms: z.literal("on"),
  ageConfirm: z.literal("on"),
  marketingEmail: z.literal("on").optional(),
});

export async function registerAction(locale: "fa" | "en", _prev: AuthResult, form: FormData): Promise<AuthResult> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) {
    const k = String(parsed.error.issues[0]?.path[0] ?? "");
    return { ok: false, error: k === "password" ? "password" : k === "acceptTerms" ? "terms" : k === "ageConfirm" ? "age" : "invalid" };
  }
  const meta = await requestMeta();
  const ipHash = hashIp(meta.ip);
  if (!(await rateLimit(`register:${ipHash}`, 5, 3600))) return { ok: false, error: "rate_limited" };
  const email = parsed.data.email.toLowerCase();
  const exists = await db().query.users.findFirst({ where: (u) => sql`lower(${u.email}) = ${email}` });
  if (exists) return { ok: false, error: "exists" };
  const passwordHash = await hashPassword(parsed.data.password);
  // New accounts are ALWAYS students; staff roles can only be granted by a super admin.
  const [user] = await db().insert(schema.users).values({ email, name: parsed.data.name, passwordHash, role: "student", locale }).returning();
  const base = { userId: user!.id, source: "register", locale, ipHash, userAgent: meta.userAgent };
  await recordConsent(db(), { ...base, purpose: "terms", granted: true, documentVersion: LEGAL_VERSIONS.terms });
  await recordConsent(db(), { ...base, purpose: "privacy_notice", granted: true, documentVersion: LEGAL_VERSIONS.privacy });
  await recordConsent(db(), { ...base, purpose: "age_confirmation", granted: true, documentVersion: LEGAL_VERSIONS.terms });
  if (parsed.data.marketingEmail) await recordConsent(db(), { ...base, purpose: "marketing_email", granted: true, documentVersion: LEGAL_VERSIONS.marketing });
  await audit(db(), { actorUserId: user!.id, action: "auth.register", entityType: "user", entityId: user!.id });
  await createSession(user!.id, meta.userAgent);
  redirect(locale === "fa" ? "/dashboard" : "/en/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

export async function requestPasswordReset(locale: "fa" | "en", _prev: AuthResult, form: FormData): Promise<AuthResult> {
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return { ok: false, error: "invalid" };
  const meta = await requestMeta();
  if (!(await rateLimit(`reset:${hashIp(meta.ip)}`, 5, 3600))) return { ok: false, error: "rate_limited" };
  const user = await db().query.users.findFirst({ where: (u) => sql`lower(${u.email}) = ${email.data.toLowerCase()}` });
  if (user && !user.disabledAt) {
    const token = randomToken();
    // Single active token per user; 1 hour expiry; stored only as a hash.
    await db().delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.userId, user.id));
    await db().insert(schema.passwordResetTokens).values({ userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + 3600_000) });
    const prefix = locale === "fa" ? "" : "/en";
    await sendTransactionalTo(user.email, locale, "password_reset", { resetUrl: `${env().APP_URL}${prefix}/reset-password?token=${encodeURIComponent(token)}` });
  }
  return { ok: true }; // same response either way (no account enumeration)
}

export async function resetPassword(_prev: AuthResult, form: FormData): Promise<AuthResult> {
  const parsed = z.object({ token: z.string().min(20).max(200), password: z.string().min(PASSWORD_MIN_LENGTH).max(200) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: "password" };
  const now = new Date();
  const [row] = await db()
    .update(schema.passwordResetTokens)
    .set({ usedAt: now })
    .where(and(eq(schema.passwordResetTokens.tokenHash, sha256(parsed.data.token)), isNull(schema.passwordResetTokens.usedAt), gt(schema.passwordResetTokens.expiresAt, now)))
    .returning();
  if (!row) return { ok: false, error: "expired" };
  await db().update(schema.users).set({ passwordHash: await hashPassword(parsed.data.password) }).where(eq(schema.users.id, row.userId));
  await db().delete(schema.sessions).where(eq(schema.sessions.userId, row.userId)); // log out everywhere
  await audit(db(), { actorUserId: row.userId, action: "auth.password_reset", entityType: "user", entityId: row.userId });
  return { ok: true };
}
