"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { markLessonComplete } from "@/lib/lms";

export async function completeLesson(courseId: string, lessonId: string) {
  const user = await requireUser();
  await markLessonComplete(user.id, z.string().uuid().parse(courseId), z.string().uuid().parse(lessonId));
  revalidatePath("/[locale]/dashboard/courses/[courseId]", "page");
}
