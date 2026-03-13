"use server";

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

export async function createNewLesson(data: {
  levelId: number;
  lessonNumber: number;
  title: string;
  audioUrl?: string;
  notesContent?: string;
}) {
  const lesson = await createLesson(data);
  return { success: true, lesson };
}

export async function editLesson(
  lessonId: number,
  data: {
    title?: string;
    audioUrl?: string | null;
    notesContent?: string | null;
  },
) {
  const lesson = await updateLesson(lessonId, data);
  return { success: true, lesson };
}

export async function removeLesson(lessonId: number) {
  await deleteLesson(lessonId);
  return { success: true };
}

export async function togglePublish(lessonId: number, publish: boolean) {
  const lesson = publish
    ? await publishLesson(lessonId)
    : await unpublishLesson(lessonId);
  return { success: true, lesson };
}

export async function addQuizQuestion(data: {
  lessonId: number;
  questionType: "multiple_choice" | "short_text";
  questionText: string;
  options?: string[];
  correctAnswer?: string;
  sortOrder: number;
}) {
  const question = await createQuizQuestion(data);
  return { success: true, question };
}

export async function editQuizQuestion(
  questionId: number,
  data: {
    questionText?: string;
    options?: string[];
    correctAnswer?: string;
    sortOrder?: number;
  },
) {
  const question = await updateQuizQuestion(questionId, data);
  return { success: true, question };
}

export async function removeQuizQuestion(questionId: number) {
  await deleteQuizQuestion(questionId);
  return { success: true };
}
