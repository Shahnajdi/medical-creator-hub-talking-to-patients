import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { verifyPrivacyRequest } from "@/lib/privacy/requests";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

const c = {
  fa: { ok: "درخواست شما تأیید شد و در صف رسیدگی قرار گرفت. نتیجه از طریق ایمیل به شما اطلاع داده می‌شود.", bad: "این لینک نامعتبر است یا قبلاً استفاده شده است." },
  en: { ok: "Your request is confirmed and queued for handling. We'll email you the outcome.", bad: "This link is invalid or has already been used." },
};

export default async function Page({ params, searchParams }: { params: Promise<{ locale: "fa" | "en" }>; searchParams: Promise<{ token?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token } = await searchParams;
  const ok = token ? await verifyPrivacyRequest(token) : false;
  return <div className="container-x max-w-xl py-20"><p role="status" className="text-lg leading-9">{ok ? c[locale].ok : c[locale].bad}</p></div>;
}
