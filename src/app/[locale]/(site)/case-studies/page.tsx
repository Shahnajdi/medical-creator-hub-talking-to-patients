import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { publishedCaseStudies } from "@/lib/content";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";
const t = { fa: { title: "نمونه‌کارها", empty: "نمونه‌کارها پس از دریافت اجازه کتبی مشتریان و بررسی داده‌ها منتشر می‌شوند. هیچ نتیجه ساختگی یا تأییدنشده‌ای اینجا نمایش داده نمی‌شود." }, en: { title: "Case studies", empty: "Case studies are published only after written client permission and data verification. No invented or unverified results are shown here." } };
export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> { return { title: t[(await params).locale].title }; }

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const rows = await publishedCaseStudies();
  return (
    <div className="container-x py-14">
      <h1 className="text-3xl font-black sm:text-5xl">{t[locale].title}</h1>
      {rows.length === 0 ? <p className="mt-8 max-w-xl rounded-2xl bg-mist p-6 leading-8">{t[locale].empty}</p> : (
        <ul className="mt-10 grid gap-5 md:grid-cols-3">{rows.map((c) => (
          <li key={c.id}><Link href={`/case-studies/${c.slug}`} className="block h-full rounded-[var(--radius-card)] border border-line p-6 hover:border-meta"><p className="text-xs font-semibold text-brand-700">{c.industry}</p><h2 className="mt-2 font-bold">{locale === "fa" ? c.titleFa : c.titleEn}</h2></Link></li>
        ))}</ul>
      )}
    </div>
  );
}
