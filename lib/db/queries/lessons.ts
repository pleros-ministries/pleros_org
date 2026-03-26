import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "../schema";

export async function getLevels() {
  return db.query.levels.findMany({
    orderBy: (l, { asc }) => [asc(l.sortOrder)],
  });
}

export async function getLevelById(id: number) {
  return db.query.levels.findFirst({
    where: (l, { eq: eq2 }) => eq2(l.id, id),
  }) ?? null;
}

export async function updateLevel(id: number, data: Partial<{
  title: string;
  description: string | null;
  sortOrder: number;
}>) {
  const [level] = await db
    .update(schema.levels)
    .set(data)
    .where(eq(schema.levels.id, id))
    .returning();
  return level;
}

export async function createLevel(data: {
  title: string;
  description?: string | null;
  sortOrder: number;
}) {
  const [level] = await db.insert(schema.levels).values(data).returning();
  return level;
}

export async function deleteLevel(id: number) {
  await db.delete(schema.levels).where(eq(schema.levels.id, id));
}

export async function getLessonsByLevel(levelId: number) {
  return db.query.lessons.findMany({
    where: (l, { eq: eq2, and: and2 }) => and2(eq2(l.levelId, levelId), eq2(l.status, "published")),
    orderBy: (l, { asc }) => [asc(l.lessonNumber)],
  });
}

export async function getAllLessonsByLevel(levelId: number) {
  return db.query.lessons.findMany({
    where: (l, { eq: eq2 }) => eq2(l.levelId, levelId),
    orderBy: (l, { asc }) => [asc(l.lessonNumber)],
  });
}

export async function getLessonById(id: number) {
  return db.query.lessons.findFirst({
    where: (l, { eq: eq2 }) => eq2(l.id, id),
  }) ?? null;
}

export async function getLessonWithProgress(lessonId: number, userId: string) {
  const lesson = await getLessonById(lessonId);
  if (!lesson) return null;

  const progress = await db.query.studentProgress.findFirst({
    where: (p, { eq: eq2, and: and2 }) =>
      and2(eq2(p.userId, userId), eq2(p.lessonId, lessonId)),
  });

  return { lesson, progress: progress ?? null };
}

export async function getStudentLevelProgress(userId: string, levelId: number) {
  const lessons = await getLessonsByLevel(levelId);
  const progress = await db
    .select()
    .from(schema.studentProgress)
    .where(eq(schema.studentProgress.userId, userId));

  return lessons.map((lesson) => {
    const p = progress.find((pr) => pr.lessonId === lesson.id);
    return {
      lesson,
      progress: p ?? null,
      completed: p ? p.audioListened && p.notesRead && p.quizPassed && p.writtenApproved : false,
    };
  });
}

export async function createLesson(data: {
  levelId: number;
  lessonNumber: number;
  title: string;
  audioUrl?: string | null;
  audioUploadKey?: string | null;
  audioFileName?: string | null;
  audioFileSize?: number | null;
  audioUploadedAt?: Date | null;
  notesContent?: string;
  status?: "draft" | "published";
}) {
  const [lesson] = await db.insert(schema.lessons).values(data).returning();
  return lesson;
}

export async function updateLesson(id: number, data: Partial<{
  title: string;
  audioUrl: string | null;
  audioUploadKey: string | null;
  audioFileName: string | null;
  audioFileSize: number | null;
  audioUploadedAt: Date | null;
  notesContent: string | null;
  status: "draft" | "published";
  lessonNumber: number;
}>) {
  const [lesson] = await db
    .update(schema.lessons)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(schema.lessons.id, id))
    .returning();
  return lesson;
}

export async function deleteLesson(id: number) {
  await db.delete(schema.lessons).where(eq(schema.lessons.id, id));
}

export async function renumberLessonsInLevel(
  levelId: number,
  lessonUpdates: Array<{ id: number; lessonNumber: number }>,
) {
  for (const [index, lesson] of lessonUpdates.entries()) {
    await db
      .update(schema.lessons)
      .set({ lessonNumber: -(index + 1), updatedAt: new Date() })
      .where(
        and(eq(schema.lessons.id, lesson.id), eq(schema.lessons.levelId, levelId)),
      );
  }

  for (const lesson of lessonUpdates) {
    await db
      .update(schema.lessons)
      .set({ lessonNumber: lesson.lessonNumber, updatedAt: new Date() })
      .where(
        and(eq(schema.lessons.id, lesson.id), eq(schema.lessons.levelId, levelId)),
      );
  }
}

export async function renumberLevels(
  levelUpdates: Array<{ id: number; sortOrder: number }>,
) {
  for (const level of levelUpdates) {
    await db
      .update(schema.levels)
      .set({ sortOrder: level.sortOrder })
      .where(eq(schema.levels.id, level.id));
  }
}
