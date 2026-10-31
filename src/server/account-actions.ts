"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { requireUser } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { destroySession } from "@/lib/auth/session";
import { erasePersonalData, exportPersonalData } from "@/lib/privacy/requests";
import { cancelSubscription } from "@/lib/payments/service";
import { revalidatePath } from "next/cache";

/** Self-service data access: a logged-in user downloads everything we hold about them. */
export async function downloadMyData() {
  const user = await requireUser();
  return JSON.stringify(await exportPersonalData(user.email), null, 2);
}

/** Self-service erasure. Requires the current password to prevent CSRF-style or shoulder-surf deletion. */
export async function deleteMyAccount(_prev: { error?: string }, form: FormData): Promise<{ error?: string }> {
  const user = await requireUser();
  const password = z.string().min(1).max(200).safeParse(form.get("password"));
  if (!password.success) return { error: "password" };
  const row = await db().query.users.findFirst({ where: (u, { eq }) => eq(u.id, user.id) });
  if (!row || !(await verifyPassword(password.data, row.passwordHash))) return { error: "password" };
  if (["super_admin", "admin"].includes(user.role)) return { error: "staff" };
  await erasePersonalData(user.email, user.id);
  await destroySession();
  redirect("/");
}

export async function cancelMySubscription(subscriptionId: string) {
  const user = await requireUser();
  const ok = await cancelSubscription(z.string().uuid().parse(subscriptionId), user.id);
  revalidatePath("/[locale]/dashboard/billing", "page");
  return ok;
}
