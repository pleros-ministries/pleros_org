"use server";

import { revalidatePath } from "next/cache";
import { getQuizQuestions, submitQuizAttempt, getAttemptCount } from "@/lib/db/queries/quizzes";

export async function submitQuiz(userId: string, lessonId: number, answers: Record<string, string>) {
  const questions = await getQuizQuestions(lessonId);
  const mcQuestions = questions.filter((q) => q.questionType === "multiple_choice");

  let correct = 0;
  for (const q of mcQuestions) {
    if (answers[String(q.id)] === q.correctAnswer) {
      correct++;
    }
  }

  const score = mcQuestions.length > 0 ? Math.round((correct / mcQuestions.length) * 100) : 0;
  const attemptCount = await getAttemptCount(userId, lessonId);

  const attempt = await submitQuizAttempt({
    userId,
    lessonId,
    answers,
    score,
    attemptNumber: attemptCount + 1,
  });

  revalidatePath("/ppc", "layout");

  return {
    score,
    passed: score >= 70,
    attemptNumber: attemptCount + 1,
  };
}
