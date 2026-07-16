import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import * as schema from "../schema";

export const CONTENT_OVERVIEW_CACHE_TAG = "ppc-content-overview";

async function queryContentOverview() {
  const [levels, lessons, questions] = await Promise.all([
    db.query.levels.findMany({
      orderBy: (level, { asc }) => [asc(level.sortOrder)],
    }),
    db.query.lessons.findMany({
      orderBy: (lesson, { asc }) => [asc(lesson.levelId), asc(lesson.lessonNumber)],
    }),
    db.query.quizQuestions.findMany({
      orderBy: (question, { asc }) => [asc(question.lessonId), asc(question.sortOrder)],
    }),
  ]);

  const lessonsByLevelId = new Map<number, typeof lessons>();
  for (const lesson of lessons) {
    const levelLessons = lessonsByLevelId.get(lesson.levelId) ?? [];
    levelLessons.push(lesson);
    lessonsByLevelId.set(lesson.levelId, levelLessons);
  }

  const questionsByLessonId = new Map<number, typeof questions>();
  for (const question of questions) {
    const lessonQuestions = questionsByLessonId.get(question.lessonId) ?? [];
    lessonQuestions.push(question);
    questionsByLessonId.set(question.lessonId, lessonQuestions);
  }

  return levels.map((level) => {
    const levelLessons = lessonsByLevelId.get(level.id) ?? [];
    const publishedCount = levelLessons.filter((lesson) => lesson.status === "published").length;
    const draftCount = levelLessons.filter((lesson) => lesson.status === "draft").length;

    return {
      ...level,
      lessons: levelLessons.map((lesson) => ({
        ...lesson,
        questions: questionsByLessonId.get(lesson.id) ?? [],
      })),
      publishedCount,
      draftCount,
      totalLessons: levelLessons.length,
    };
  });
}

const getCachedContentOverview = unstable_cache(
  queryContentOverview,
  [CONTENT_OVERVIEW_CACHE_TAG],
  {
    tags: [CONTENT_OVERVIEW_CACHE_TAG],
    revalidate: 60,
  },
);

export async function getContentOverview() {
  return getCachedContentOverview();
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
