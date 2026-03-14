"use server";

import { revalidatePath } from "next/cache";
import {
  createLesson,
  updateLesson,
  deleteLesson,
} from "@/lib/db/queries/lessons";
import {
  publishLesson,
  unpublishLesson,
} from "@/lib/db/queries/content";
import {
  createQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
} from "@/lib/db/queries/quizzes";
import { requireAdmin } from "@/lib/auth/require-role";

export async function createNewLesson(data: {
  levelId: number;
  lessonNumber: number;
  title: string;
  audioUrl?: string;
  notesContent?: string;
}) {
  await requireAdmin();
  const lesson = await createLesson(data);
  revalidatePath("/ppc", "layout");
  return lesson;
}

export async function updateLessonContent(
  lessonId: number,
  data: { title?: string; audioUrl?: string | null; notesContent?: string | null },
) {
  await requireAdmin();
  const lesson = await updateLesson(lessonId, data);
  revalidatePath("/ppc", "layout");
  return lesson;
}

export async function removeLessonAction(lessonId: number) {
  await requireAdmin();
  await deleteLesson(lessonId);
  revalidatePath("/ppc", "layout");
}

export async function publishLessonAction(lessonId: number) {
  await requireAdmin();
  const lesson = await publishLesson(lessonId);
  revalidatePath("/ppc", "layout");
  return lesson;
}

export async function unpublishLessonAction(lessonId: number) {
  await requireAdmin();
  const lesson = await unpublishLesson(lessonId);
  revalidatePath("/ppc", "layout");
  return lesson;
}

export async function addQuizQuestion(data: {
  lessonId: number;
  questionType: "multiple_choice" | "short_text";
  questionText: string;
  options?: string[] | null;
  correctAnswer?: string | null;
  sortOrder?: number;
}) {
  await requireAdmin();
  const question = await createQuizQuestion(data);
  revalidatePath("/ppc", "layout");
  return question;
}

export async function editQuizQuestion(
  id: number,
  data: { questionText?: string; options?: string[] | null; correctAnswer?: string | null; sortOrder?: number },
) {
  await requireAdmin();
  const question = await updateQuizQuestion(id, data);
  revalidatePath("/ppc", "layout");
  return question;
}

export async function removeQuizQuestion(id: number) {
  await requireAdmin();
  await deleteQuizQuestion(id);
  revalidatePath("/ppc", "layout");
}
