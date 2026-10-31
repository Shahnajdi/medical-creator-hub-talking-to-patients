import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { userGuard } from "@/lib/auth/guard";
import { Link } from "@/i18n/navigation";

export default async function Dashboard({ params }: { params: Promise<{ locale: "fa" | "en" }> }) {
  const { locale } = await params;
  const u = await userGuard(locale, "/dashboard");
  const enrollments = await db().select({ id: schema.enrollments.id, courseId: schema.courses.id, titleFa: schema.courses.titleFa, titleEn: schema.courses.titleEn, status: schema.enrollments.status }).from(schema.enrollments).innerJoin(schema.courses, eq(schema.courses.id, schema.enrollments.courseId)).where(eq(schema.enrollments.userId, u.id));
  const fa = locale === "fa";
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">{fa ? `سلام ${u.name}` : `Hi ${u.name}`}</h1>
      {enrollments.length === 0 ? (
        <p className="rounded-2xl bg-mist p-5 leading-8">{fa ? "هنوز در دوره‌ای ثبت‌نام نکرده‌اید." : "You're not enrolled in any course yet."} <Link href="/courses" className="text-brand-700 underline">{fa ? "مشاهده دوره‌ها" : "Browse courses"}</Link></p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">{enrollments.map((e) => <li key={e.id}><Link href={`/dashboard/courses/${e.courseId}`} className="block rounded-2xl p-5 ring-1 ring-line hover:ring-meta"><span className="font-bold">{fa ? e.titleFa : e.titleEn}</span><span className="block text-sm text-slate-strong">{e.status}</span></Link></li>)}</ul>
      )}
    </div>
  );
}
