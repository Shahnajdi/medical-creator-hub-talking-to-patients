import "server-only";
import { schema, type DB, type Tx } from "@/db";

export async function audit(
  conn: DB | Tx,
  entry: { actorUserId?: string | null; action: string; entityType: string; entityId?: string | null; data?: Record<string, unknown> },
) {
  await conn.insert(schema.auditLogs).values({
    actorUserId: entry.actorUserId ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    data: entry.data,
  });
}
