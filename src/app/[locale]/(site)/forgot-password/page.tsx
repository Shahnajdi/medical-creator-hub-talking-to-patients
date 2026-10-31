import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ForgotForm } from "@/components/forms/AuthForms";

export const metadata: Metadata = { robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  return (
    <div className="container-x max-w-md py-14">
      <h1 className="mb-8 text-3xl font-black">{t("resetTitle")}</h1>
      <ForgotForm />
    </div>
  );
}
