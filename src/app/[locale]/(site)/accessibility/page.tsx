import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { AccessibilityDoc } from "@/content/legal/other";

const titles = { fa: "بیانیه دسترس‌پذیری", en: "Accessibility statement" };

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale], alternates: { canonical: locale === "fa" ? "/accessibility" : "/en/accessibility", languages: { fa: "/accessibility", en: "/en/accessibility" } } };
}

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <LegalPage title={titles[locale]} version={undefined}>
      <AccessibilityDoc locale={locale} />
    </LegalPage>
  );
}
