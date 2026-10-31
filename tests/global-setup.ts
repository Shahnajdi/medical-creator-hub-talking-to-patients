import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

export default async function setup() {
  const url = process.env.TEST_DATABASE_URL ?? "postgres://najditech:najditech@localhost:5432/najditech_test";
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  await sql.unsafe("DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; DROP SCHEMA IF EXISTS drizzle CASCADE;");
  await migrate(drizzle(sql), { migrationsFolder: "./drizzle" });
  const { bootstrapReferenceData } = await import("../src/db/bootstrap");
  await bootstrapReferenceData(sql);
  await sql.end();
}
