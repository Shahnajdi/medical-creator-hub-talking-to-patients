import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { bootstrapReferenceData } from "../src/db/bootstrap";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required");
  const sql = postgres(url, { max: 1 });
  const db = drizzle(sql);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await bootstrapReferenceData(sql);
  await sql.end();
  console.log("Migrations applied and reference data ensured.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
