import "@fontsource-variable/vazirmatn";
import "@fontsource-variable/inter";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing, dirOf } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const viewport: Viewport = { themeColor: "#080B12", width: "device-width", initialScale: 1 };

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return {
    metadataBase: new URL(base),
    title: { default: t("defaultTitle"), template: `%s | NajdiTech` },
    description: t("defaultDescription"),
    openGraph: { siteName: "NajdiTech", locale: locale === "fa" ? "fa_IR" : "en_US", type: "website" },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "nav" });

  return (
    <html lang={locale} dir={dirOf(locale)}>
      <body className="min-h-dvh antialiased">
        <NextIntlClientProvider>
          <a href="#main" className="sr-only z-[60] rounded-lg bg-lime px-4 py-2 font-semibold text-ink focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
            {t("skip")}
          </a>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
