import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { services } from "@/content/pages";
import { Link } from "@/i18n/navigation";

const t = { fa: { title: "خدمات", lead: "خدمات NajdiTech برای کسب‌وکارهایی که می‌خواهند از تبلیغات دیجیتال مشتری واقعی جذب کنند.", cta: "درخواست بررسی رایگان" }, en: { title: "Services", lead: "NajdiTech services for businesses that want real customers from digital advertising.", cta: "Request a free review" } };
export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> { const { locale } = await params; return { title: t[locale].title, description: t[locale].lead }; }

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params; setRequestLocale(locale);
  return (
    <div className="container-x py-14 sm:py-20">
      <h1 className="text-3xl font-black sm:text-5xl">{t[locale].title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-9 text-slate-strong">{t[locale].lead}</p>
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {Object.entries(services).map(([slug, s]) => (
          <li key={slug}><Link href={`/services/${slug}`} className="flex h-full flex-col rounded-[var(--radius-card)] border border-line p-6 hover:border-meta"><h2 className="text-lg font-bold">{s[locale].title}</h2><p className="mt-2 leading-8 text-slate-strong">{s[locale].lead}</p></Link></li>
        ))}
      </ul>
      <Link href="/free-audit" className="mt-10 inline-flex min-h-12 items-center rounded-full bg-meta px-6 font-semibold text-white">{t[locale].cta}</Link>
    </div>
  );
}
