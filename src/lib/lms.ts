import "server-only";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";

/** Returns the course outline for an ACTIVE enrollment of this user, with drip locks applied; null if no access. */
export async function courseForStudent(userId: string, courseId: string, now = new Date()) {
  const enrollment = await db().query.enrollments.findFirst({
    where: (e, { and, eq }) => and(eq(e.userId, userId), eq(e.courseId, courseId), inArray(e.status, ["active", "completed"])),
  });
  if (!enrollment) return null;
  const course = await db().query.courses.findFirst({ where: (c, { eq }) => eq(c.id, courseId) });
  if (!course) return null;
  const modules = await db().select().from(schema.courseModules).where(eq(schema.courseModules.courseId, courseId)).orderBy(asc(schema.courseModules.position));
  const lessons = modules.length ? await db().select().from(schema.lessons).where(inArray(schema.lessons.moduleId, modules.map((m) => m.id))).orderBy(asc(schema.lessons.position)) : [];
  const done = new Set((await db().select({ id: schema.lessonProgress.lessonId }).from(schema.lessonProgress).where(eq(schema.lessonProgress.enrollmentId, enrollment.id))).map((r) => r.id));
  const daysIn = (now.getTime() - enrollment.enrolledAt.getTime()) / 86400_000;
  return {
    enrollment,
    course,
    modules: modules.map((m) => ({ ...m, locked: daysIn < m.unlockAfterDays, lessons: lessons.filter((l) => l.moduleId === m.id).map((l) => ({ ...l, done: done.has(l.id) })) })),
    progress: lessons.length ? Math.round((done.size / lessons.length) * 100) : 0,
  };
}

export async function markLessonComplete(userId: string, courseId: string, lessonId: string) {
  const data = await courseForStudent(userId, courseId);
  if (!data) throw new Error("forbidden");
  const mod = data.modules.find((m) => m.lessons.some((l) => l.id === lessonId));
  if (!mod || mod.locked) throw new Error("forbidden");
  await db().insert(schema.lessonProgress).values({ enrollmentId: data.enrollment.id, lessonId }).onConflictDoNothing();
  const total = data.modules.reduce((n, m) => n + m.lessons.length, 0);
  const doneCount = data.modules.reduce((n, m) => n + m.lessons.filter((l) => l.done || l.id === lessonId).length, 0);
  if (total > 0 && doneCount === total && data.enrollment.status !== "completed") {
    await db().update(schema.enrollments).set({ status: "completed", completedAt: new Date() }).where(and(eq(schema.enrollments.id, data.enrollment.id)));
  }
}
