import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { robots: { index: false } };

export default async function Page({ params, searchParams }: { params: Promise<{ locale: "fa" | "en" }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations("auth");
  return (
    <div className="container-x max-w-md py-14">
      <h1 className="mb-8 text-3xl font-black">{t("resetTitle")}</h1>
      <ResetForm token={sp.token ?? ""} />
    </div>
  );
}
