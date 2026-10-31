import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Fixed-window rate limiter backed by Postgres (works across instances).
 * Returns true when the request is allowed.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000);
  const rows = await db().execute<{ count: number }>(sql`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, ${windowStart.toISOString()}, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = rate_limits.count + 1
    RETURNING count`);
  return Number(rows[0]?.count ?? 0) <= limit;
}
