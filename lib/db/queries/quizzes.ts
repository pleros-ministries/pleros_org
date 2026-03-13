import { eq, and, desc, count } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "../schema";

export async function getQuizQuestions(lessonId: number) {
  return db.query.quizQuestions.findMany({
    where: (q, { eq: eq2 }) => eq2(q.lessonId, lessonId),
    orderBy: (q, { asc }) => [asc(q.sortOrder)],
  });
}

export async function getBestQuizScore(userId: string, lessonId: number) {
  const attempts = await db
    .select()
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.userId, userId), eq(schema.quizAttempts.lessonId, lessonId)))
    .orderBy(desc(schema.quizAttempts.score))
    .limit(1);

  return attempts[0]?.score ?? null;
}

export async function getQuizAttempts(userId: string, lessonId: number) {
  return db
    .select()
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.userId, userId), eq(schema.quizAttempts.lessonId, lessonId)))
    .orderBy(desc(schema.quizAttempts.createdAt));
}

export async function getAttemptCount(userId: string, lessonId: number) {
  const [result] = await db
    .select({ count: count() })
    .from(schema.quizAttempts)
    .where(and(eq(schema.quizAttempts.userId, userId), eq(schema.quizAttempts.lessonId, lessonId)));
  return result?.count ?? 0;
}

export async function submitQuizAttempt(data: {
  userId: string;
  lessonId: number;
  answers: Record<string, string>;
  score: number;
  attemptNumber: number;
}) {
  const [attempt] = await db.insert(schema.quizAttempts).values(data).returning();

  if (data.score >= 70) {
    await db
      .insert(schema.studentProgress)
      .values({
        userId: data.userId,
        lessonId: data.lessonId,
        quizPassed: true,
        highestQuizScore: data.score,
      })
      .onConflictDoUpdate({
        target: [schema.studentProgress.userId, schema.studentProgress.lessonId],
        set: {
          quizPassed: true,
          highestQuizScore: data.score,
        },
      });
  }

  return attempt;
}

export async function createQuizQuestion(data: {
  lessonId: number;
  questionType: "multiple_choice" | "short_text";
  questionText: string;
  options?: string[] | null;
  correctAnswer?: string | null;
  sortOrder?: number;
}) {
  const [question] = await db.insert(schema.quizQuestions).values(data).returning();
  return question;
}

export async function updateQuizQuestion(id: number, data: Partial<{
  questionText: string;
  options: string[] | null;
  correctAnswer: string | null;
  sortOrder: number;
}>) {
  const [question] = await db
    .update(schema.quizQuestions)
    .set(data)
    .where(eq(schema.quizQuestions.id, id))
    .returning();
  return question;
}

export async function deleteQuizQuestion(id: number) {
  await db.delete(schema.quizQuestions).where(eq(schema.quizQuestions.id, id));
}
