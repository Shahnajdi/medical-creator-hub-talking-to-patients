import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal/LegalPage";
import { subprocessors } from "@/lib/legal/config";

export const dynamic = "force-dynamic";
const titles = { fa: "پردازشگرهای فرعی", en: "Subprocessors" };

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> {
  return { title: titles[(await params).locale] };
}

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const fa = locale === "fa";
  const active = subprocessors().filter((s) => s.active);
  return (
    <LegalPage title={titles[locale]}>
      <p>{fa ? "این فهرست ارائه‌دهندگانی را نشان می‌دهد که در حال حاضر برای اجرای این سایت داده‌های شخصی را از طرف ما پردازش می‌کنند. با هر ارائه‌دهنده قرارداد پردازش داده داریم. فهرست به‌طور خودکار از پیکربندی فعلی سیستم ساخته می‌شود." : "This list shows the providers that currently process personal data on our behalf to run this site. We have a data processing agreement with each. The list is generated from the system's current configuration."}</p>
      {active.length ? (
        <table>
          <thead><tr><th>{fa ? "ارائه‌دهنده" : "Provider"}</th><th>{fa ? "هدف" : "Purpose"}</th><th>{fa ? "محل پردازش" : "Location"}</th></tr></thead>
          <tbody>{active.map((s) => <tr key={s.name}><td>{s.name}</td><td>{s.purpose[locale]}</td><td>{s.location}</td></tr>)}</tbody>
        </table>
      ) : (
        <p data-testid="no-subprocessors">{fa ? "در حال حاضر هیچ پردازشگر فرعی پیکربندی نشده است." : "No subprocessors are currently configured."}</p>
      )}
    </LegalPage>
  );
}
