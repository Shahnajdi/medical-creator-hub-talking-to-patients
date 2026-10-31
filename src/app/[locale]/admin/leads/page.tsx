import { pageGuard } from "@/lib/auth/guard";
import { listLeads } from "@/lib/crm/queries";
import { can } from "@/lib/auth/rbac";
import { adminLabels } from "@/components/admin/labels";
import { Link } from "@/i18n/navigation";

export default async function Leads({ params, searchParams }: { params: Promise<{ locale: "fa" | "en" }>; searchParams: Promise<{ q?: string; type?: string; qualification?: string }> }) {
  const { locale } = await params;
  const user = await pageGuard("admin.access", locale, "/admin/leads");
  const sp = await searchParams;
  const L = adminLabels[locale];
  const type = sp.type === "agency" || sp.type === "training" ? sp.type : undefined;
  const qualification = ["high", "medium", "nurture", "not_qualified"].includes(sp.qualification ?? "") ? sp.qualification : undefined;
  const rows = await listLeads(user, { q: sp.q?.slice(0, 100), type, qualification });
  const df = new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", { dateStyle: "medium" });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{L.leads}</h1>
        {/* Plain <a>: this is a file download from an API route, not page navigation. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        {can(user.role, "crm.export") && <a href="/api/admin/leads-export" className="rounded-full bg-midnight px-4 py-2 text-sm font-semibold text-white">{L.export}</a>}
      </div>
      <form className="flex flex-wrap gap-2" role="search">
        <label className="sr-only" htmlFor="q">{L.search}</label>
        <input id="q" name="q" defaultValue={sp.q} placeholder={L.search} className="min-h-11 flex-1 rounded-xl border border-line bg-white px-3" />
        <select name="type" defaultValue={type ?? ""} aria-label={L.type} className="min-h-11 rounded-xl border border-line bg-white px-3">
          <option value="">{L.all}</option><option value="agency">{L.agency}</option><option value="training">{L.training}</option>
        </select>
        <select name="qualification" defaultValue={qualification ?? ""} aria-label={L.qual} className="min-h-11 rounded-xl border border-line bg-white px-3">
          <option value="">{L.all}</option>{(["high", "medium", "nurture", "not_qualified"] as const).map((q) => <option key={q} value={q}>{L[q]}</option>)}
        </select>
        <button className="min-h-11 rounded-xl bg-meta px-4 font-semibold text-white">{L.filter}</button>
      </form>
      {rows.length === 0 ? <p className="rounded-xl bg-white p-4 ring-1 ring-line">{L.noData}</p> : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-line">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-mist text-start"><tr>{[L.name, L.type, L.company, L.country, L.score, L.qual, L.date].map((h) => <th key={h} scope="col" className="p-3 text-start font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="p-3"><Link href={`/admin/contacts/${r.contactId}`} className="font-semibold text-brand-700 underline">{r.name}</Link><div className="text-xs text-slate-strong" dir="ltr">{r.email ?? r.whatsapp}</div></td>
                  <td className="p-3">{L[r.type]}</td>
                  <td className="p-3">{r.company ?? "—"}</td>
                  <td className="p-3">{r.country}</td>
                  <td className="p-3">{r.type === "agency" ? r.score : "—"}</td>
                  <td className="p-3">{L[r.qualification]}</td>
                  <td className="p-3 whitespace-nowrap">{df.format(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
