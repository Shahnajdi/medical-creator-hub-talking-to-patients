import { setRequestLocale } from "next-intl/server";
import { homeContent } from "@/content/home";
import { Link } from "@/i18n/navigation";

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const r = homeContent[locale].resources;
  return (
    <div className="container-x py-14">
      <h1 className="text-3xl font-black sm:text-5xl">{r.eyebrow}</h1>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {([["business", "/free-audit"], ["learner", "/free-meta-ads-guide"]] as const).map(([k, href]) => (
          <div key={k} className="rounded-[var(--radius-card)] border border-line p-7"><h2 className="text-lg font-bold">{r[k].title}</h2><p className="mt-2 leading-8 text-slate-strong">{r[k].body}</p><Link href={href} className="mt-6 inline-flex min-h-12 items-center rounded-full bg-midnight px-5 font-semibold text-white">{r[k].cta}</Link></div>
        ))}
      </div>
    </div>
  );
}
