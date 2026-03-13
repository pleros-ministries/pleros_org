import { eq, and, asc } from "drizzle-orm";
import { db } from "../index";
import { lessons, levels, studentProgress } from "../schema";

export async function getLevels() {
  return db.select().from(levels).orderBy(asc(levels.sortOrder));
}

export async function getLevelById(levelId: number) {
  const [level] = await db.select().from(levels).where(eq(levels.id, levelId));
  return level ?? null;
}

export async function getLessonsByLevel(levelId: number) {
  return db
    .select()
    .from(lessons)
    .where(eq(lessons.levelId, levelId))
    .orderBy(asc(lessons.lessonNumber));
}

export async function getPublishedLessonsByLevel(levelId: number) {
  return db
    .select()
    .from(lessons)
    .where(and(eq(lessons.levelId, levelId), eq(lessons.status, "published")))
    .orderBy(asc(lessons.lessonNumber));
}

export async function getLessonById(lessonId: number) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
  return lesson ?? null;
}

export async function getLessonWithProgress(lessonId: number, userId: string) {
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
  if (!lesson) return null;

  const [progress] = await db
    .select()
    .from(studentProgress)
    .where(
      and(eq(studentProgress.lessonId, lessonId), eq(studentProgress.userId, userId)),
    );

  const [level] = await db.select().from(levels).where(eq(levels.id, lesson.levelId));

  return {
    lesson,
    progress: progress ?? null,
    level: level ?? null,
  };
}

export async function getAdjacentLessons(lessonId: number, levelId: number) {
  const allLessons = await getLessonsByLevel(levelId);
  const idx = allLessons.findIndex((l) => l.id === lessonId);
  return {
    prev: idx > 0 ? allLessons[idx - 1] : null,
    next: idx < allLessons.length - 1 ? allLessons[idx + 1] : null,
  };
}

export async function createLesson(data: {
  levelId: number;
  lessonNumber: number;
  title: string;
  audioUrl?: string;
  notesContent?: string;
  status?: "draft" | "published";
}) {
  const [lesson] = await db
    .insert(lessons)
    .values(data)
    .returning();
  return lesson;
}

export async function updateLesson(
  lessonId: number,
  data: Partial<{
    title: string;
    audioUrl: string | null;
    notesContent: string | null;
    status: "draft" | "published";
  }>,
) {
  const [lesson] = await db
    .update(lessons)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(lessons.id, lessonId))
    .returning();
  return lesson;
}

export async function deleteLesson(lessonId: number) {
  await db.delete(lessons).where(eq(lessons.id, lessonId));
}
