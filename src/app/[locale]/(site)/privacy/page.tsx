import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { LEGAL_VERSIONS } from "@/lib/legal/config";
import { PrivacyEn, PrivacyFa } from "@/content/legal/privacy";
import { getSetting } from "@/lib/settings";
import type { RetentionConfig } from "@/lib/privacy/retention-config";

export const dynamic = "force-dynamic";

const titles = { fa: "سیاست حریم خصوصی", en: "Privacy Policy" };

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: titles[locale], alternates: { canonical: locale === "fa" ? "/privacy" : "/en/privacy", languages: { fa: "/privacy", en: "/en/privacy" } } };
}

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const R = await getSetting<RetentionConfig>("privacy.retention");
  return (
    <LegalPage title={titles[locale]} version={LEGAL_VERSIONS.privacy}>
      {locale === "fa" ? <PrivacyFa R={R} /> : <PrivacyEn R={R} />}
    </LegalPage>
  );
}
