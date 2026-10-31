import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { SimplePage } from "@/components/ui/SimplePage";
import { homeContent } from "@/content/home";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> { const t = homeContent[(await params).locale].training; return { title: t.eyebrow, description: t.title }; }

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const t = homeContent[locale].training;
  return (
    <SimplePage title={t.title} items={t.points} cta={{ href: "/courses", label: t.cta }}>
      <p className="mt-8 rounded-xl bg-mist p-4 text-sm leading-7">{t.note}</p>
      <Link href="/free-meta-ads-guide" className="mt-6 inline-block font-semibold text-brand-700 underline">{homeContent[locale].resources.learner.cta}</Link>
    </SimplePage>
  );
}
