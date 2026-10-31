import "server-only";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { randomToken, sha256 } from "@/lib/crypto";
import { can, type Permission, type Role } from "./rbac";

export const SESSION_COOKIE = "nt_session";
const SESSION_DAYS = 14;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  locale: string;
  timezone: string;
};

export async function createSession(userId: string, userAgent?: string | null) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db().insert(schema.sessions).values({ userId, tokenHash: sha256(token), expiresAt, userAgent: userAgent?.slice(0, 300) });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db().delete(schema.sessions).where(eq(schema.sessions.tokenHash, sha256(token)));
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db()
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      role: schema.users.role,
      locale: schema.users.locale,
      timezone: schema.users.timezone,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(
      and(
        eq(schema.sessions.tokenHash, sha256(token)),
        gt(schema.sessions.expiresAt, new Date()),
        isNull(schema.users.disabledAt),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}

export class AuthError extends Error {
  constructor(public readonly status: 401 | 403) {
    super(status === 401 ? "Unauthenticated" : "Forbidden");
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError(401);
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, permission)) throw new AuthError(403);
  return user;
}
