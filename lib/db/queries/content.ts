import { eq, asc } from "drizzle-orm";
import { db } from "../index";
import { lessons, levels, quizQuestions } from "../schema";

export async function getContentOverview() {
  const allLevels = await db.select().from(levels).orderBy(asc(levels.sortOrder));

  const result = [];
  for (const level of allLevels) {
    const levelLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.levelId, level.id))
      .orderBy(asc(lessons.lessonNumber));

    result.push({
      level,
      lessons: levelLessons,
      publishedCount: levelLessons.filter((l) => l.status === "published").length,
      draftCount: levelLessons.filter((l) => l.status === "draft").length,
    });
  }

  return result;
}

export async function getLessonForEdit(lessonId: number) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return null;

  const questions = await db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.lessonId, lessonId))
    .orderBy(asc(quizQuestions.sortOrder));

  return { lesson, questions };
}

export async function publishLesson(lessonId: number) {
  const [lesson] = await db
    .update(lessons)
    .set({ status: "published", updatedAt: new Date() })
    .where(eq(lessons.id, lessonId))
    .returning();
  return lesson;
}

export async function unpublishLesson(lessonId: number) {
  const [lesson] = await db
    .update(lessons)
    .set({ status: "draft", updatedAt: new Date() })
    .where(eq(lessons.id, lessonId))
    .returning();
  return lesson;
}
