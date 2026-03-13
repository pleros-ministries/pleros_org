import { eq, count } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "../schema";

export async function getContentOverview() {
  const levels = await db.query.levels.findMany({
    orderBy: (l, { asc }) => [asc(l.sortOrder)],
  });

  const enriched = await Promise.all(
    levels.map(async (level) => {
      const lessons = await db.query.lessons.findMany({
        where: (l, { eq: eq2 }) => eq2(l.levelId, level.id),
        orderBy: (l, { asc }) => [asc(l.lessonNumber)],
      });

      const publishedCount = lessons.filter((l) => l.status === "published").length;
      const draftCount = lessons.filter((l) => l.status === "draft").length;

      return {
        ...level,
        lessons,
        publishedCount,
        draftCount,
        totalLessons: lessons.length,
      };
    })
  );

  return enriched;
}

export async function getLessonForEdit(lessonId: number) {
  const lesson = await db.query.lessons.findFirst({
    where: (l, { eq: eq2 }) => eq2(l.id, lessonId),
  });

  if (!lesson) return null;

  const questions = await db.query.quizQuestions.findMany({
    where: (q, { eq: eq2 }) => eq2(q.lessonId, lessonId),
    orderBy: (q, { asc }) => [asc(q.sortOrder)],
  });

  return { lesson, questions };
}

export async function publishLesson(id: number) {
  const [lesson] = await db
    .update(schema.lessons)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(schema.lessons.id, id))
    .returning();
  return lesson;
}

export async function unpublishLesson(id: number) {
  const [lesson] = await db
    .update(schema.lessons)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(schema.lessons.id, id))
    .returning();
  return lesson;
}
