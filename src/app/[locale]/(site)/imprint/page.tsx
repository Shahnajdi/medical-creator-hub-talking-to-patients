import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { ImprintDoc } from "@/content/legal/other";

const titles = { fa: "مشخصات کسب‌وکار", en: "Business details" };

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale], alternates: { canonical: locale === "fa" ? "/imprint" : "/en/imprint", languages: { fa: "/imprint", en: "/en/imprint" } } };
}

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title={titles[locale]} version={undefined}>
      <ImprintDoc locale={locale} />
    </LegalPage>
  );
}
