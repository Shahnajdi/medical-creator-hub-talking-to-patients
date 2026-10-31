import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { services, type ServiceSlug } from "@/content/pages";
import { SimplePage } from "@/components/ui/SimplePage";

export function generateStaticParams() { return Object.keys(services).map((slug) => ({ slug })); }
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en"; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params; const s = services[slug as ServiceSlug]?.[locale];
  return s ? { title: s.title, description: s.lead, alternates: { canonical: locale === "fa" ? `/services/${slug}` : `/en/services/${slug}`, languages: { fa: `/services/${slug}`, en: `/en/services/${slug}` } } } : {};
}

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en"; slug: string }> }) {
  const { locale, slug } = await params; setRequestLocale(locale);
  const s = services[slug as ServiceSlug]?.[locale]; if (!s) notFound();
  return <SimplePage title={s.title} lead={s.lead} items={s.items} cta={{ href: "/free-audit", label: locale === "fa" ? "درخواست بررسی رایگان" : "Request a free review" }} />;
}
