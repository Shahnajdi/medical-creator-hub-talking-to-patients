import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_VERSIONS } from "@/lib/legal/config";
import { TermsEn, TermsFa } from "@/content/legal/terms";

const titles = { fa: "شرایط استفاده", en: "Terms of Service" };

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale], alternates: { canonical: locale === "fa" ? "/terms" : "/en/terms", languages: { fa: "/terms", en: "/en/terms" } } };
}

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title={titles[locale]} version={LEGAL_VERSIONS.terms}>
      {locale === "fa" ? <TermsFa /> : <TermsEn />}
    </LegalPage>
  );
}
