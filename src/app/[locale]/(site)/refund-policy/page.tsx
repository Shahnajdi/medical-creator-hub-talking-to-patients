import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_VERSIONS } from "@/lib/legal/config";
import { RefundDoc } from "@/content/legal/other";

const titles = { fa: "سیاست بازپرداخت", en: "Refund Policy" };

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale], alternates: { canonical: locale === "fa" ? "/refund-policy" : "/en/refund-policy", languages: { fa: "/refund-policy", en: "/en/refund-policy" } } };
}

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title={titles[locale]} version={LEGAL_VERSIONS.refund}>
      <RefundDoc locale={locale} />
    </LegalPage>
  );
}
