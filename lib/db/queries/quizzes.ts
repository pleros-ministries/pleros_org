import { eq, and, asc, desc } from "drizzle-orm";
import { db } from "../index";
import { quizQuestions, quizAttempts, studentProgress } from "../schema";

export async function getQuizQuestions(lessonId: number) {
  return db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.lessonId, lessonId))
    .orderBy(asc(quizQuestions.sortOrder));
}

export async function getQuizAttempts(userId: string, lessonId: number) {
  return db
    .select()
    .from(quizAttempts)
    .where(
      and(eq(quizAttempts.userId, userId), eq(quizAttempts.lessonId, lessonId)),
    )
    .orderBy(desc(quizAttempts.createdAt));
}

export async function getBestQuizScore(userId: string, lessonId: number) {
  const attempts = await getQuizAttempts(userId, lessonId);
  if (attempts.length === 0) return null;
  return Math.max(...attempts.map((a) => a.score));
}

export async function submitQuizAttempt(data: {
  userId: string;
  lessonId: number;
  answers: Record<string, string>;
}) {
  const questions = await getQuizQuestions(data.lessonId);
  const mcQuestions = questions.filter((q) => q.questionType === "multiple_choice");

  let correct = 0;
  for (const q of mcQuestions) {
    if (data.answers[String(q.id)] === q.correctAnswer) {
      correct++;
    }
  }

  const totalGradable = mcQuestions.length;
  const score = totalGradable === 0 ? 100 : Math.round((correct / totalGradable) * 100);

  const existingAttempts = await getQuizAttempts(data.userId, data.lessonId);
  const attemptNumber = existingAttempts.length + 1;

  const [attempt] = await db
    .insert(quizAttempts)
    .values({
      userId: data.userId,
      lessonId: data.lessonId,
      answers: data.answers,
      score,
      attemptNumber,
    })
    .returning();

  if (score >= 70) {
    const [existing] = await db
      .select()
      .from(studentProgress)
      .where(
        and(
          eq(studentProgress.userId, data.userId),
          eq(studentProgress.lessonId, data.lessonId),
        ),
      );

    if (existing) {
      const newHighest = Math.max(existing.highestQuizScore ?? 0, score);
      await db
        .update(studentProgress)
        .set({ quizPassed: true, highestQuizScore: newHighest })
        .where(eq(studentProgress.id, existing.id));
    } else {
      await db.insert(studentProgress).values({
        userId: data.userId,
        lessonId: data.lessonId,
        quizPassed: true,
        highestQuizScore: score,
      });
    }
  }

  return { attempt, score, passed: score >= 70, totalQuestions: questions.length, mcCorrect: correct, mcTotal: totalGradable };
}

export async function createQuizQuestion(data: {
  lessonId: number;
  questionType: "multiple_choice" | "short_text";
  questionText: string;
  options?: string[];
  correctAnswer?: string;
  sortOrder: number;
}) {
  const [q] = await db.insert(quizQuestions).values(data).returning();
  return q;
}

export async function updateQuizQuestion(
  questionId: number,
  data: Partial<{
    questionText: string;
    options: string[];
    correctAnswer: string;
    sortOrder: number;
  }>,
) {
  const [q] = await db
    .update(quizQuestions)
    .set(data)
    .where(eq(quizQuestions.id, questionId))
    .returning();
  return q;
}

export async function deleteQuizQuestion(questionId: number) {
  await db.delete(quizQuestions).where(eq(quizQuestions.id, questionId));
}
