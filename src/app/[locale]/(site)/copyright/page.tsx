import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { CopyrightDoc } from "@/content/legal/other";

const titles = { fa: "کپی‌رایت و گزارش تخلف", en: "Copyright & takedown" };

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale], alternates: { canonical: locale === "fa" ? "/copyright" : "/en/copyright", languages: { fa: "/copyright", en: "/en/copyright" } } };
}

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title={titles[locale]} version={undefined}>
      <CopyrightDoc locale={locale} />
    </LegalPage>
  );
}
