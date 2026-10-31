import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/lib/env";

export type DB = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

const globalForDb = globalThis as unknown as { __najdiSql?: ReturnType<typeof postgres>; __najdiDb?: DB };

export function db(): DB {
  if (globalForDb.__najdiDb) return globalForDb.__najdiDb;
  const sql = postgres(env().DATABASE_URL, { max: 10, prepare: true });
  globalForDb.__najdiSql = sql;
  globalForDb.__najdiDb = drizzle(sql, { schema });
  return globalForDb.__najdiDb;
}

export async function closeDb() {
  await globalForDb.__najdiSql?.end({ timeout: 5 });
  globalForDb.__najdiSql = undefined;
  globalForDb.__najdiDb = undefined;
}

export { schema };
