import "server-only";
import { notFound, redirect } from "next/navigation";
import { getSessionUser, type SessionUser } from "./session";
import { can, type Permission } from "./rbac";

/** For pages: redirect to login when signed out; 404 (not 403) when lacking permission so admin URLs aren't revealed. */
export async function pageGuard(permission: Permission, locale: string, path: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`${locale === "fa" ? "" : "/en"}/login?next=${encodeURIComponent(path)}`);
  if (!can(user.role, permission)) notFound();
  return user;
}

/** For customer pages: any signed-in user; data access is still scoped to user.id in each query. */
export async function userGuard(locale: string, path: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`${locale === "fa" ? "" : "/en"}/login?next=${encodeURIComponent(path)}`);
  return user;
}
