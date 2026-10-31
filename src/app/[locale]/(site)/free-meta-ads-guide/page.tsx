import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { TrainingLeadForm } from "@/components/forms/TrainingLeadForm";
import { publishedResource } from "@/lib/content";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

const c = {
  fa: {
    title: "نقشه راه رایگان یادگیری Meta Ads",
    lead: "اگر می‌خواهی تبلیغات متا را یاد بگیری ولی نمی‌دانی از کجا شروع کنی، این نقشه راه ترتیب یادگیری مفاهیم را قدم‌به‌قدم نشانت می‌دهد.",
    benefits: ["مفاهیم پایه‌ای که باید اول یاد بگیری", "ترتیب پیشنهادی یادگیری بخش‌های Ads Manager", "اشتباه‌های رایج مبتدی‌ها و راه پرهیز از آن‌ها"],
    submit: "دریافت نقشه راه",
    unavailableTitle: "این منبع در حال آماده‌سازی است",
    unavailable: "تا زمانی که فایل نهایی آماده نشده، اطلاعاتی از شما دریافت نمی‌کنیم. فعلاً می‌توانید صفحه آموزش‌ها را ببینید.",
    seeTraining: "مشاهده آموزش‌ها",
    form: "دریافت رایگان",
  },
  en: {
    title: "Free Meta Ads learning roadmap",
    lead: "Want to learn Meta advertising but not sure where to start? This roadmap shows you, step by step, what to learn and in what order.",
    benefits: ["The fundamentals to learn first", "A suggested order for learning Ads Manager", "Common beginner mistakes and how to avoid them"],
    submit: "Get the roadmap",
    unavailableTitle: "This resource is being prepared",
    unavailable: "We won't collect your details until the final file is ready. In the meantime you can browse our training.",
    seeTraining: "See training",
    form: "Get it free",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: c[locale].title, description: c[locale].lead };
}

export default async function FreeGuide({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = c[locale];
  const resource = await publishedResource("training");
  return (
    <div className="bg-mist">
      <div className="container-x grid gap-10 py-12 sm:py-16 lg:grid-cols-2">
        <div>
          <h1 className="text-3xl font-black leading-tight sm:text-4xl">{t.title}</h1>
          <p className="mt-4 leading-9 text-slate-strong">{t.lead}</p>
          <ul className="mt-6 space-y-2">
            {t.benefits.map((b) => <li key={b} className="flex gap-3 leading-8"><CheckCircle2 aria-hidden className="mt-1.5 size-5 shrink-0 text-meta" />{b}</li>)}
          </ul>
        </div>
        <section aria-labelledby="form-title" className="relative rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] ring-1 ring-line sm:p-8">
          {resource ? (
            <>
              <h2 id="form-title" className="mb-6 text-lg font-bold">{t.form}</h2>
              <TrainingLeadForm submitLabel={t.submit} />
            </>
          ) : (
            <div data-testid="resource-unavailable">
              <h2 id="form-title" className="text-lg font-bold">{t.unavailableTitle}</h2>
              <p className="mt-3 leading-8 text-slate-strong">{t.unavailable}</p>
              <Link href="/training" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-meta px-5 font-semibold text-white">{t.seeTraining}</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
