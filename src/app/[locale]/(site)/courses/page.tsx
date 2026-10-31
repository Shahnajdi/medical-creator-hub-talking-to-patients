import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { publishedCourses } from "@/lib/content";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";
const t = { fa: { title: "دوره‌های آموزشی", empty: "دوره‌ای هنوز برای ثبت‌نام منتشر نشده است. می‌توانید با دریافت نقشه راه رایگان شروع کنید.", cta: "دریافت نقشه راه رایگان" }, en: { title: "Courses", empty: "No courses are open for enrollment yet. You can start with the free roadmap.", cta: "Get the free roadmap" } };
export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en" }> }): Promise<Metadata> { return { title: t[(await params).locale].title }; }

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params; setRequestLocale(locale);
  const courses = await publishedCourses();
  return (
    <div className="container-x py-14">
      <h1 className="text-3xl font-black sm:text-5xl">{t[locale].title}</h1>
      {courses.length === 0 ? (
        <div className="mt-8 max-w-xl rounded-2xl bg-mist p-6"><p className="leading-8">{t[locale].empty}</p><Link href="/free-meta-ads-guide" className="mt-4 inline-block font-semibold text-brand-700 underline">{t[locale].cta}</Link></div>
      ) : (
        <ul className="mt-10 grid gap-5 md:grid-cols-3">{courses.map((c) => (
          <li key={c.id}><Link href={`/courses/${c.slug}`} className="block h-full rounded-[var(--radius-card)] border border-line p-6 hover:border-meta"><h2 className="font-bold">{locale === "fa" ? c.titleFa : c.titleEn}</h2><p className="mt-2 text-sm leading-7 text-slate-strong">{locale === "fa" ? c.summaryFa : c.summaryEn}</p></Link></li>
        ))}</ul>
      )}
    </div>
  );
}
