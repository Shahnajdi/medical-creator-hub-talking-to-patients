import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { pageGuard } from "@/lib/auth/guard";
import { adminLabels } from "@/components/admin/labels";

export default async function AuditLogs({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  await pageGuard("audit.read", locale, "/admin/audit-logs");
  const L = adminLabels[locale];
  const rows = await db()
    .select({ id: schema.auditLogs.id, action: schema.auditLogs.action, entityType: schema.auditLogs.entityType, entityId: schema.auditLogs.entityId, createdAt: schema.auditLogs.createdAt, actor: schema.users.email })
    .from(schema.auditLogs)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
    .orderBy(desc(schema.auditLogs.createdAt))
    .limit(300);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{L.audit}</h1>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-mist"><tr>{[L.date, L.action, L.entity, L.actor].map((h) => <th key={h} scope="col" className="p-3 text-start">{h}</th>)}</tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-t border-line">
              <td className="p-3 whitespace-nowrap" dir="ltr">{r.createdAt.toISOString().replace("T", " ").slice(0, 19)}</td>
              <td className={`p-3 ${r.action.startsWith("security") || r.action.includes("failed") || r.action.includes("mismatch") ? "font-semibold text-danger" : ""}`}>{r.action}</td>
              <td className="p-3">{r.entityType} {r.entityId ? <span className="text-xs text-slate-strong">{r.entityId.slice(0, 8)}</span> : null}</td>
              <td className="p-3" dir="ltr">{r.actor ?? "system"}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}
