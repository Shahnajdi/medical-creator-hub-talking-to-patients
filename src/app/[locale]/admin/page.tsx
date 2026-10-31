import { pageGuard } from "@/lib/auth/guard";
import { overviewMetrics } from "@/lib/crm/queries";
import { adminLabels } from "@/components/admin/labels";
import { formatMoney } from "@/lib/payments/types";

export default async function AdminHome({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  await pageGuard("analytics.read", locale, "/admin");
  const L = adminLabels[locale];
  const m = await overviewMetrics(30);
  const nf = new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US");
  const cards: [string, number][] = [
    [L.totalLeads, m.totalLeads], [L.qualified, m.qualified], [L.agencyLeads, m.agencyLeads], [L.trainingLeads, m.trainingLeads],
    [L.appointments, m.appointments], [L.won, m.won], [L.enrollments, m.enrollments], [L.tasksDue, m.tasksDue], [L.failedJobs, m.failedJobs],
  ];
  return (
    <div className="space-y-8">
      <header><h1 className="text-2xl font-black">{L.overview}</h1><p className="text-sm text-slate-strong">{L.last30}</p></header>
      {m.totalLeads === 0 && <p className="rounded-xl bg-white p-4 text-sm ring-1 ring-line">{L.noData}</p>}
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white p-4 ring-1 ring-line">
            <dt className="text-xs text-slate-strong">{label}</dt>
            <dd className={`mt-1 text-2xl font-black ${label === L.failedJobs && value > 0 ? "text-danger" : ""}`}>{nf.format(value)}</dd>
          </div>
        ))}
      </dl>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <h2 className="font-bold">{L.revenue}</h2>
          {m.revenue.length ? <ul className="mt-3 space-y-1">{m.revenue.map((r) => <li key={r.currency} className="ltr-nums">{formatMoney(Number(r.total), r.currency, locale)}</li>)}</ul> : <p className="mt-2 text-sm text-slate-strong">—</p>}
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <h2 className="font-bold">{L.sources}</h2>
          {m.sources.length ? <ul className="mt-3 space-y-1 text-sm">{m.sources.map((s) => <li key={s.source} className="flex justify-between"><span>{s.source}</span><span>{nf.format(s.n)}</span></li>)}</ul> : <p className="mt-2 text-sm text-slate-strong">—</p>}
        </div>
      </section>
    </div>
  );
}
