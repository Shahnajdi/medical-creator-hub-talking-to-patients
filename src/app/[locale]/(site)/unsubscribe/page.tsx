import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { UnsubscribeButton } from "@/components/forms/UnsubscribeButton";

export const metadata: Metadata = { robots: { index: false } };

const c = {
  fa: { title: "لغو اشتراک ایمیل‌های تبلیغاتی", body: "با یک کلیک دیگر هیچ ایمیل تبلیغاتی یا آموزشی از ما دریافت نمی‌کنید. پیام‌های ضروری مربوط به خرید یا حسابتان همچنان ارسال می‌شوند.", button: "لغو اشتراک", done: "اشتراک شما لغو شد. دیگر ایمیل تبلیغاتی از ما دریافت نمی‌کنید.", error: "این لینک معتبر نیست." },
  en: { title: "Unsubscribe from marketing emails", body: "One click and you won't receive any more marketing or educational emails from us. Essential messages about purchases or your account will still be sent.", button: "Unsubscribe", done: "You're unsubscribed. You won't receive marketing emails from us again.", error: "This link is not valid." },
};

export default async function Page({ params, searchParams }: { params: Promise<{ locale: "fa" | "en" }>; searchParams: Promise<{ token?: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token } = await searchParams;
  const t = c[locale];
  return (
    <div className="container-x max-w-xl py-20">
      <h1 className="text-2xl font-black">{t.title}</h1>
      <p className="mt-4 mb-8 leading-8 text-slate-strong">{t.body}</p>
      {token ? <UnsubscribeButton token={token} labels={t} /> : <p className="text-danger">{t.error}</p>}
    </div>
  );
}
