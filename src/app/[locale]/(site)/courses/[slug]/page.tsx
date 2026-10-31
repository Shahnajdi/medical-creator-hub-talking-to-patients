import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { asc, eq, inArray } from "drizzle-orm";
import { setRequestLocale } from "next-intl/server";
import { db, schema } from "@/db";
import { Link } from "@/i18n/navigation";
import { formatMoney } from "@/lib/payments/types";

export const dynamic = "force-dynamic";

async function load(slug: string) {
  const course = await db().query.courses.findFirst({ where: (c, { and, eq }) => and(eq(c.slug, slug), eq(c.status, "published")) });
  if (!course) return null;
  const modules = await db().select().from(schema.courseModules).where(eq(schema.courseModules.courseId, course.id)).orderBy(asc(schema.courseModules.position));
  const lessons = modules.length ? await db().select({ id: schema.lessons.id, moduleId: schema.lessons.moduleId, titleFa: schema.lessons.titleFa, titleEn: schema.lessons.titleEn }).from(schema.lessons).where(inArray(schema.lessons.moduleId, modules.map((m) => m.id))).orderBy(asc(schema.lessons.position)) : [];
  const product = await db().query.products.findFirst({ where: (p, { and, eq }) => and(eq(p.courseId, course.id), eq(p.status, "published")) });
  const prices = product ? await db().query.productPrices.findMany({ where: (pp, { and, eq }) => and(eq(pp.productId, product.id), eq(pp.active, true)) }) : [];
  return { course, modules, lessons, product, prices };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: "fa" | "en"; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params; const d = await load(slug);
  return d ? { title: locale === "fa" ? d.course.titleFa : d.course.titleEn, description: locale === "fa" ? d.course.summaryFa : d.course.summaryEn } : {};
}

export default async function Page({ params }: { params: Promise<{ locale: "fa" | "en"; slug: string }> }) {
  const { locale, slug } = await params; setRequestLocale(locale);
  const d = await load(slug); if (!d) notFound();
  const fa = locale === "fa";
  return (
    <div className="container-x grid gap-10 py-14 lg:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="text-3xl font-black sm:text-4xl">{fa ? d.course.titleFa : d.course.titleEn}</h1>
        <p className="mt-4 leading-9 text-slate-strong">{fa ? d.course.summaryFa : d.course.summaryEn}</p>
        <h2 className="mt-10 text-xl font-bold">{fa ? "سرفصل‌ها" : "Curriculum"}</h2>
        <ol className="mt-4 space-y-4">{d.modules.map((m) => (
          <li key={m.id} className="rounded-2xl p-4 ring-1 ring-line"><h3 className="font-bold">{fa ? m.titleFa : m.titleEn}</h3>
            <ul className="mt-2 list-disc ps-5 text-sm leading-7 text-slate-strong">{d.lessons.filter((l) => l.moduleId === m.id).map((l) => <li key={l.id}>{fa ? l.titleFa : l.titleEn}</li>)}</ul></li>
        ))}</ol>
        <p className="mt-8 rounded-xl bg-mist p-4 text-sm leading-7">{fa ? "این دوره مهارت آموزش می‌دهد و درآمد، استخدام یا جذب مشتری را تضمین نمی‌کند." : "This course teaches skills and does not guarantee income, employment or clients."}</p>
      </div>
      <aside className="h-fit rounded-2xl p-5 ring-1 ring-line">
        {d.product && d.prices.length ? (
          <>
            <ul className="space-y-1 text-lg font-bold ltr-nums">{d.prices.map((p) => <li key={p.id}>{formatMoney(p.amountMinor, p.currency, locale)}</li>)}</ul>
            {d.product.billingInterval !== "one_time" && <p className="mt-2 text-sm">{fa ? "اشتراک با تمدید خودکار — لغو در هر زمان" : "Auto-renewing subscription — cancel anytime"}</p>}
            <Link href={`/checkout/${d.product.slug}`} className="mt-4 flex min-h-12 items-center justify-center rounded-full bg-meta font-semibold text-white">{fa ? "ثبت‌نام" : "Enroll"}</Link>
          </>
        ) : <p className="text-sm text-slate-strong">{fa ? "ثبت‌نام این دوره هنوز باز نشده است." : "Enrollment is not open yet."}</p>}
      </aside>
    </div>
  );
}
