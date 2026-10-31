import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { AgencyLeadForm } from "@/components/forms/AgencyLeadForm";

const c = {
  fa: {
    title: "بررسی اولیه رایگان تبلیغات کسب‌وکار شما",
    lead: "چند سؤال کوتاه درباره کسب‌وکار و تبلیغاتتان جواب دهید. تیم NajdiTech اطلاعات شما را بررسی می‌کند و برای گفت‌وگو درباره فرصت‌ها و قدم بعدی با شما تماس می‌گیرد.",
    forTitle: "مناسب چه کسانی است؟",
    forItems: ["صاحبان کسب‌وکاری که می‌خواهند از تبلیغات متا مشتری جذب کنند", "کسانی که تبلیغ کرده‌اند ولی از نتیجه راضی نیستند", "کسب‌وکارهایی که نمی‌دانند از کجا شروع کنند"],
    getTitle: "چه چیزی دریافت می‌کنید؟",
    getItems: ["بررسی اولیه وضعیت فعلی تبلیغات و حضور آنلاین شما", "یک گفت‌وگوی کوتاه درباره اولویت‌ها و قدم‌های پیشنهادی", "بدون هیچ تعهد خرید"],
    honest: "این یک بررسی اولیه است، نه ممیزی کامل حساب تبلیغاتی. اگر به بررسی عمیق‌تر نیاز باشد، شرایط آن را جداگانه و شفاف اعلام می‌کنیم.",
    form: "فرم درخواست",
  },
  en: {
    title: "A free initial review of your business's advertising",
    lead: "Answer a few short questions about your business and advertising. The NajdiTech team reviews your details and contacts you to discuss opportunities and next steps.",
    forTitle: "Who is it for?",
    forItems: ["Business owners who want to win customers with Meta ads", "Advertisers unhappy with their current results", "Businesses that are not sure where to start"],
    getTitle: "What you get",
    getItems: ["An initial look at your current ads and online presence", "A short conversation about priorities and suggested next steps", "No obligation to buy"],
    honest: "This is an initial review, not a full ad-account audit. If a deeper review is needed, we will explain the terms separately and clearly.",
    form: "Request form",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: c[locale].title, description: c[locale].lead, alternates: { canonical: locale === "fa" ? "/free-audit" : "/en/free-audit", languages: { fa: "/free-audit", en: "/en/free-audit" } } };
}

export default async function FreeAudit({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = c[locale];
  return (
    <div className="bg-mist">
      <div className="container-x grid gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">{t.title}</h1>
          <p className="mt-4 leading-9 text-slate-strong">{t.lead}</p>
          {[[t.forTitle, t.forItems], [t.getTitle, t.getItems]].map(([h, items]) => (
            <div key={h as string} className="mt-8">
              <h2 className="font-bold">{h as string}</h2>
              <ul className="mt-3 space-y-2">
                {(items as string[]).map((i) => <li key={i} className="flex gap-3 leading-8"><CheckCircle2 aria-hidden className="mt-1.5 size-5 shrink-0 text-meta" />{i}</li>)}
              </ul>
            </div>
          ))}
          <p className="mt-8 rounded-xl border border-line bg-white p-4 text-sm leading-7 text-slate-strong">{t.honest}</p>
        </div>
        <section aria-labelledby="form-title" className="relative rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-line sm:p-8">
          <h2 id="form-title" className="mb-6 text-lg font-bold">{t.form}</h2>
          <AgencyLeadForm />
        </section>
      </div>
    </div>
  );
}
