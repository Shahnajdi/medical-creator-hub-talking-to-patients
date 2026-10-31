import { AuthError, requirePermission } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { db } from "@/db";
import { listLeads } from "@/lib/crm/queries";
import { csvCell } from "@/lib/csv";

export async function GET() {
  try {
    const user = await requirePermission("crm.export");
    const rows = await listLeads(user, { limit: 10_000 });
    const header = ["created_at", "type", "name", "email", "whatsapp", "country", "company", "score", "qualification", "source"];
    const lines = rows.map((r) => [r.createdAt, r.type, r.name, r.email, r.whatsapp, r.country, r.company, r.score, r.qualification, r.source].map(csvCell).join(","));
    await audit(db(), { actorUserId: user.id, action: "crm.export", entityType: "lead", data: { rows: rows.length } });
    return new Response([header.join(","), ...lines].join("\n"), {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
    });
  } catch (e) {
    if (e instanceof AuthError) return new Response(null, { status: e.status });
    throw e;
  }
}
