"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/require-role";
import { getStudentSelfActor } from "@/lib/auth/action-actor";
import { assertCanAccessPublishedLesson } from "@/lib/auth/student-lesson-access";
import {
  markLessonAudioListened,
  markLessonNotesRead,
} from "@/lib/db/queries/lesson-progress";

export async function markAudioListened(lessonId: number) {
  const session = await requireAuth();
  const { userId } = getStudentSelfActor(session);
  await assertCanAccessPublishedLesson(userId, lessonId);
  await markLessonAudioListened(userId, lessonId);
  revalidatePath("/ppc", "layout");
}

export async function markNotesRead(lessonId: number) {
  const session = await requireAuth();
  const { userId } = getStudentSelfActor(session);
  await assertCanAccessPublishedLesson(userId, lessonId);
  await markLessonNotesRead(userId, lessonId);
  revalidatePath("/ppc", "layout");
}
