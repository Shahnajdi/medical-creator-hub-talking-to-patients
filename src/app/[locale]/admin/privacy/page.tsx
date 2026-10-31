import { desc, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { pageGuard } from "@/lib/auth/guard";
import { adminLabels } from "@/components/admin/labels";
import { PrivacyActions } from "@/components/admin/PrivacyActions";

export default async function PrivacyRequests({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  await pageGuard("privacy.manage", locale, "/admin/privacy");
  const L = adminLabels[locale];
  const rows = await db().select().from(schema.privacyRequests).where(ne(schema.privacyRequests.status, "unverified")).orderBy(desc(schema.privacyRequests.createdAt)).limit(200);
  const df = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { dateStyle: "medium" });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{L.privacy}</h1>
      {rows.length === 0 ? <p className="rounded-xl bg-white p-4 ring-1 ring-line">{L.noData}</p> : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const overdue = r.dueAt && r.dueAt < new Date() && !["completed", "rejected"].includes(r.status);
            return (
              <li key={r.id} className="rounded-2xl bg-white p-4 ring-1 ring-line">
                <p className="font-semibold" dir="ltr">{r.email}</p>
                <p className="text-sm">{L.reqType}: {r.type} · {L.status}: {r.status} · {L.due}: <span className={overdue ? "font-bold text-danger" : ""}>{r.dueAt ? df.format(r.dueAt) : "—"}</span></p>
                {r.details && <p className="mt-2 text-sm text-slate-strong">{r.details}</p>}
                {!["completed", "rejected"].includes(r.status) && <div className="mt-3"><PrivacyActions id={r.id} type={r.type} labels={L} /></div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
