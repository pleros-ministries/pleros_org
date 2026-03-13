import { eq, and } from "drizzle-orm";
import { db } from "../index";
import { levelGraduations, studentProgress, lessons } from "../schema";

export async function isLevelGraduated(userId: string, levelId: number) {
  const [g] = await db
    .select()
    .from(levelGraduations)
    .where(
      and(
        eq(levelGraduations.userId, userId),
        eq(levelGraduations.levelId, levelId),
      ),
    );
  return !!g;
}

export async function checkGraduationReadiness(userId: string, levelId: number) {
  const levelLessons = await db
    .select({ id: lessons.id })
    .from(lessons)
    .where(eq(lessons.levelId, levelId));

  if (levelLessons.length === 0) return { ready: false, completedCount: 0, totalCount: 0 };

  const progress = await db
    .select()
    .from(studentProgress)
    .innerJoin(lessons, eq(studentProgress.lessonId, lessons.id))
    .where(
      and(
        eq(studentProgress.userId, userId),
        eq(lessons.levelId, levelId),
      ),
    );

  const completedCount = progress.filter(
    (p) =>
      p.student_progress.audioListened &&
      p.student_progress.notesRead &&
      p.student_progress.quizPassed &&
      p.student_progress.writtenApproved,
  ).length;

  return {
    ready: completedCount >= levelLessons.length,
    completedCount,
    totalCount: levelLessons.length,
  };
}

export async function graduateStudent(userId: string, levelId: number, graduatedBy: string, isOverride = false) {
  const [existing] = await db
    .select()
    .from(levelGraduations)
    .where(
      and(
        eq(levelGraduations.userId, userId),
        eq(levelGraduations.levelId, levelId),
      ),
    );

  if (existing) return existing;

  const [graduation] = await db
    .insert(levelGraduations)
    .values({ userId, levelId, graduatedBy, isOverride })
    .returning();

  return graduation;
}
