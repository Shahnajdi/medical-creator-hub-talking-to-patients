import "server-only";
import { sql } from "drizzle-orm";
import { schema, type DB, type Tx } from "@/db";

export async function enqueue(
  conn: DB | Tx,
  job: { type: string; payload: Record<string, unknown>; idempotencyKey: string; runAt?: Date; maxAttempts?: number },
) {
  await conn
    .insert(schema.jobs)
    .values({
      type: job.type,
      payload: job.payload,
      idempotencyKey: job.idempotencyKey,
      runAt: job.runAt ?? new Date(),
      maxAttempts: job.maxAttempts ?? 5,
    })
    .onConflictDoNothing({ target: schema.jobs.idempotencyKey });
}

export type ClaimedJob = typeof schema.jobs.$inferSelect;

/** Atomically claims up to `limit` due jobs (safe with multiple workers). */
export async function claimJobs(conn: DB, limit = 10): Promise<ClaimedJob[]> {
  const rows = await conn.execute<Record<string, unknown>>(sql`
    UPDATE jobs SET status = 'running', locked_at = now(), attempts = attempts + 1
    WHERE id IN (
      SELECT id FROM jobs
      WHERE (status = 'pending' AND run_at <= now())
         OR (status = 'running' AND locked_at < now() - interval '10 minutes')
      ORDER BY run_at
      LIMIT ${limit}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id`);
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id as string);
  return conn.query.jobs.findMany({ where: (j, { inArray }) => inArray(j.id, ids) });
}

export function backoffMs(attempt: number): number {
  return Math.min(60 * 60_000, 30_000 * 2 ** (attempt - 1));
}
