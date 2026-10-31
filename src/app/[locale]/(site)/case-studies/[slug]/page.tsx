import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { db } from "@/db";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en"; slug: string }> }) {
  const { locale, slug } = await params; setRequestLocale(locale);
  const c = await db().query.caseStudies.findFirst({ where: (cs, { and, eq }) => and(eq(cs.slug, slug), eq(cs.status, "published"), eq(cs.clientPermission, true)) });
  if (!c) notFound();
  const fa = locale === "fa";
  const sections: [string, string][] = [[fa ? "چالش" : "Challenge", fa ? c.challengeFa : c.challengeEn], [fa ? "استراتژی" : "Strategy", fa ? c.strategyFa : c.strategyEn], [fa ? "نتایج" : "Outcomes", fa ? c.outcomesFa : c.outcomesEn]];
  return (
    <article className="container-x max-w-3xl py-14">
      <p className="text-sm font-semibold text-brand-700">{c.industry}{c.periodStart && c.periodEnd ? ` · ${c.periodStart} – ${c.periodEnd}` : ""}</p>
      <h1 className="mt-2 text-3xl font-black">{fa ? c.titleFa : c.titleEn}</h1>
      {c.metrics.length > 0 && <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">{c.metrics.map((m) => <div key={m.labelEn} className="rounded-2xl bg-mist p-4"><dt className="text-xs text-slate-strong">{fa ? m.labelFa : m.labelEn}</dt><dd className="mt-1 text-xl font-black ltr-nums">{m.value}</dd></div>)}</dl>}
      {sections.map(([h, b]) => <section key={h}><h2 className="mt-10 text-xl font-bold">{h}</h2><p className="mt-3 whitespace-pre-wrap leading-9 text-slate-strong">{b}</p></section>)}
      <p className="mt-10 text-xs text-slate-strong">{fa ? "منتشرشده با اجازه مشتری. نتایج گذشته تضمینی برای نتایج آینده نیست." : "Published with client permission. Past results do not guarantee future results."}</p>
    </article>
  );
}
