import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false } };

const c = {
  fa: {
    agency: { title: "درخواست شما ثبت شد", body: "اطلاعاتتان با موفقیت ذخیره شد. تیم ما آن را بررسی می‌کند و از طریق روش ارتباطی که انتخاب کردید با شما تماس می‌گیرد.", cta: "رزرو جلسه آشنایی", href: "/book-call" },
    training: { title: "نقشه راه آماده دریافت است", body: "اطلاعاتتان ثبت شد. می‌توانید همین حالا فایل را دریافت کنید. اگر ایمیل وارد کرده باشید، لینک دریافت برایتان ایمیل هم می‌شود.", cta: "مشاهده دوره‌های آموزشی", href: "/training", download: "دریافت نقشه راه (PDF)" },
  },
  en: {
    agency: { title: "Your request has been received", body: "Your details were saved successfully. Our team will review them and contact you through the method you chose.", cta: "Book a discovery call", href: "/book-call" },
    training: { title: "Your roadmap is ready", body: "Your details were saved. You can download the file now. If you entered an email, we'll also email you the link.", cta: "See training", href: "/training", download: "Download the roadmap (PDF)" },
  },
};

export default async function ThankYou({ params, searchParams }: { params: Promise<{ locale: "fa" | "en" }>; searchParams: Promise<{ funnel?: string; dl?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const funnel = sp.funnel === "training" ? "training" : "agency";
  const t = c[locale][funnel];
  return (
    <div className="container-x max-w-2xl py-20 text-center">
      <CheckCircle2 aria-hidden className="mx-auto size-14 text-success" />
      <h1 className="mt-6 text-3xl font-black">{t.title}</h1>
      <p className="mt-4 leading-9 text-slate-strong">{t.body}</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        {funnel === "training" && sp.dl && "download" in t && (
          <a href={`/api/resources/download?token=${encodeURIComponent(sp.dl)}`} className="inline-flex min-h-12 items-center justify-center rounded-full bg-meta px-6 font-semibold text-white">{t.download}</a>
        )}
        <Link href={t.href} className="inline-flex min-h-12 items-center justify-center rounded-full px-6 font-semibold ring-1 ring-line">{t.cta}</Link>
      </div>
    </div>
  );
}
