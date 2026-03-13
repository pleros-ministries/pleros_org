"use server";

import { submitQuizAttempt } from "@/lib/db/queries/quizzes";

export async function submitQuiz(userId: string, lessonId: number, answers: Record<string, string>) {
  const result = await submitQuizAttempt({ userId, lessonId, answers });
  return result;
}
