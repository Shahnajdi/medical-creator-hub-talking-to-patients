import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PrivacyRequestForm } from "@/components/forms/PrivacyRequestForm";
import { PRIVACY_REQUEST_SLA_DAYS } from "@/lib/legal/config";

const c = {
  fa: { title: "درخواست دسترسی، اصلاح یا حذف داده‌ها", lead: `برای حفاظت از اطلاعات شما، ابتدا با ارسال لینک به ایمیلتان هویت شما را تأیید می‌کنیم. پس از تأیید، حداکثر ظرف ${PRIVACY_REQUEST_SLA_DAYS} روز به درخواست رسیدگی می‌شود.` },
  en: { title: "Access, correct or delete your data", lead: `To protect your information we first verify your identity by emailing you a link. Once confirmed, we handle the request within ${PRIVACY_REQUEST_SLA_DAYS} days.` },
};

export const metadata: Metadata = { robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="container-x max-w-xl py-14">
      <h1 className="text-3xl font-black">{c[locale].title}</h1>
      <p className="mt-4 leading-8 text-slate-strong">{c[locale].lead}</p>
      <div className="mt-8"><PrivacyRequestForm /></div>
    </div>
  );
}
