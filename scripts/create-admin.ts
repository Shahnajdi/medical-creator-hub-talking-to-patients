import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { sql } from "drizzle-orm";
import { db, schema, closeDb } from "../src/db";
import { hashPassword, PASSWORD_MIN_LENGTH } from "../src/lib/auth/password";
import { audit } from "../src/lib/audit";

/**
 * Creates (or promotes) a super admin. The ONLY way to create the first staff
 * account — there is no self-service path to staff roles.
 * Usage: npm run create-admin -- you@example.com "Your Name"
 * The password is read interactively (never from argv, which leaks into shell history).
 */
async function main() {
  const [email, name] = process.argv.slice(2);
  if (!email || !name) throw new Error('Usage: npm run create-admin -- <email> "<name>"');
  const rl = createInterface({ input: stdin, output: stdout });
  const password = process.env.ADMIN_PASSWORD ?? (await rl.question(`Password (min ${PASSWORD_MIN_LENGTH} chars): `));
  rl.close();
  if (password.length < PASSWORD_MIN_LENGTH) throw new Error("Password too short");
  const passwordHash = await hashPassword(password);
  const existing = await db().query.users.findFirst({ where: (u) => sql`lower(${u.email}) = ${email.toLowerCase()}` });
  const user = existing
    ? (await db().update(schema.users).set({ role: "super_admin", passwordHash, disabledAt: null }).where(sql`id = ${existing.id}`).returning())[0]
    : (await db().insert(schema.users).values({ email: email.toLowerCase(), name, passwordHash, role: "super_admin" }).returning())[0];
  await audit(db(), { action: "team.super_admin_created_cli", entityType: "user", entityId: user!.id });
  console.log(`Super admin ready: ${user!.email}`);
}
main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(closeDb);
