import { notFound } from "next/navigation";
import { z } from "zod";
import { Lock, CheckCircle2 } from "lucide-react";
import { userGuard } from "@/lib/auth/guard";
import { courseForStudent } from "@/lib/lms";
import { completeLesson } from "@/server/lms-actions";

export default async function CoursePlayer({ params, searchParams }: { params: Promise<{ locale: "fa" | "en"; courseId: string }>; searchParams: Promise<{ lesson?: string }> }) {
  const { locale, courseId } = await params;
  if (!z.string().uuid().safeParse(courseId).success) notFound();
  const user = await userGuard(locale, `/dashboard/courses/${courseId}`);
  const data = await courseForStudent(user.id, courseId);
  if (!data) notFound(); // no enrollment → no access, no information leak
  const fa = locale === "fa";
  const all = data.modules.filter((m) => !m.locked).flatMap((m) => m.lessons);
  const { lesson: lessonId } = await searchParams;
  const current = all.find((l) => l.id === lessonId) ?? all.find((l) => !l.done) ?? all[0];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
      <article>
        <h1 className="text-2xl font-black">{fa ? data.course.titleFa : data.course.titleEn}</h1>
        <p className="mt-1 text-sm text-slate-strong">{fa ? "پیشرفت" : "Progress"}: {data.progress}%</p>
        {current ? (
          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-bold">{fa ? current.titleFa : current.titleEn}</h2>
            {current.videoUrl && <video controls preload="metadata" className="aspect-video w-full rounded-2xl bg-ink" src={current.videoUrl} />}
            {(fa ? current.bodyFa : current.bodyEn) && <div className="whitespace-pre-wrap leading-9">{fa ? current.bodyFa : current.bodyEn}</div>}
            {!current.done && <form action={completeLesson.bind(null, courseId, current.id)}><button className="min-h-12 rounded-full bg-meta px-5 font-semibold text-white">{fa ? "علامت‌گذاری به‌عنوان تکمیل‌شده" : "Mark as complete"}</button></form>}
          </div>
        ) : <p className="mt-6 text-slate-strong">{fa ? "محتوایی برای این دوره منتشر نشده است." : "No content has been published for this course yet."}</p>}
      </article>
      <nav aria-label={fa ? "سرفصل‌ها" : "Curriculum"} className="space-y-4">
        {data.modules.map((m) => (
          <div key={m.id}>
            <h3 className="flex items-center gap-2 text-sm font-bold">{m.locked && <Lock aria-label={fa ? "قفل" : "Locked"} className="size-4" />}{fa ? m.titleFa : m.titleEn}</h3>
            {m.locked ? <p className="text-xs text-slate-strong">{fa ? `${m.unlockAfterDays} روز پس از ثبت‌نام باز می‌شود` : `Unlocks ${m.unlockAfterDays} days after enrollment`}</p> : (
              <ul className="mt-2 space-y-1">{m.lessons.map((l) => (
                <li key={l.id}><a href={`?lesson=${l.id}`} aria-current={l.id === current?.id ? "page" : undefined} className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-mist aria-[current=page]:bg-mist">{l.done && <CheckCircle2 aria-label={fa ? "تکمیل‌شده" : "Completed"} className="size-4 text-success" />}{fa ? l.titleFa : l.titleEn}</a></li>
              ))}</ul>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}
