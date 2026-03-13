import { eq, and, ilike, or, sql, desc, asc, count } from "drizzle-orm";
import { db } from "../index";
import {
  users,
  studentProgress,
  lessons,
  levels,
  levelGraduations,
  writtenSubmissions,
  qaThreads,
} from "../schema";

export type StudentListItem = {
  id: string;
  name: string;
  email: string;
  location: string | null;
  level: number;
  levelTitle: string;
  progressPercent: number;
  currentLesson: string;
  lastActivity: string | null;
  qaPending: number;
  reviewsPending: number;
  graduationStatus: "in_progress" | "ready_for_review" | "graduated";
  createdAt: Date;
};

export type StudentFilter = {
  query?: string;
  level?: number;
  page?: number;
  perPage?: number;
  sortBy?: "name" | "level" | "progress" | "lastActivity";
  sortDir?: "asc" | "desc";
};

export async function getStudentById(userId: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, userId), eq(users.role, "student")));
  return user ?? null;
}

export async function listStudents(filter: StudentFilter = {}) {
  const { query, level, page = 1, perPage = 20 } = filter;
  const offset = (page - 1) * perPage;

  const conditions = [eq(users.role, "student")];
  if (query) {
    conditions.push(
      or(
        ilike(users.name, `%${query}%`),
        ilike(users.email, `%${query}%`),
      )!,
    );
  }

  const rows = await db
    .select()
    .from(users)
    .where(and(...conditions))
    .orderBy(asc(users.name))
    .limit(perPage)
    .offset(offset);

  const [{ total }] = await db
    .select({ total: count() })
    .from(users)
    .where(and(...conditions));

  return { rows, total };
}

export async function getStudentProgress(userId: string) {
  return db
    .select({
      lessonId: studentProgress.lessonId,
      audioListened: studentProgress.audioListened,
      notesRead: studentProgress.notesRead,
      quizPassed: studentProgress.quizPassed,
      highestQuizScore: studentProgress.highestQuizScore,
      writtenApproved: studentProgress.writtenApproved,
      completedAt: studentProgress.completedAt,
      lessonNumber: lessons.lessonNumber,
      lessonTitle: lessons.title,
      levelId: lessons.levelId,
    })
    .from(studentProgress)
    .innerJoin(lessons, eq(studentProgress.lessonId, lessons.id))
    .where(eq(studentProgress.userId, userId))
    .orderBy(asc(lessons.levelId), asc(lessons.lessonNumber));
}

export async function getStudentGraduations(userId: string) {
  return db
    .select({
      levelId: levelGraduations.levelId,
      graduatedAt: levelGraduations.graduatedAt,
      isOverride: levelGraduations.isOverride,
    })
    .from(levelGraduations)
    .where(eq(levelGraduations.userId, userId))
    .orderBy(asc(levelGraduations.levelId));
}

export async function getStudentCurrentLevel(userId: string): Promise<number> {
  const graduations = await getStudentGraduations(userId);
  const graduatedLevels = new Set(graduations.map((g) => g.levelId));
  for (let l = 1; l <= 5; l++) {
    if (!graduatedLevels.has(l)) return l;
  }
  return 5;
}

export async function getStudentLevelProgress(userId: string, levelId: number) {
  const levelLessons = await db
    .select({ id: lessons.id, lessonNumber: lessons.lessonNumber })
    .from(lessons)
    .where(eq(lessons.levelId, levelId))
    .orderBy(asc(lessons.lessonNumber));

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

  const totalLessons = levelLessons.length;
  const progressPercent = totalLessons === 0 ? 0 : Math.round((completedCount / totalLessons) * 100);

  return {
    totalLessons,
    completedCount,
    progressPercent,
    lessons: levelLessons,
    progress: progress.map((p) => p.student_progress),
  };
}

export async function updateStudentLevel(userId: string, level: number) {
  await db.update(users).set({ startingLevel: level }).where(eq(users.id, userId));
}

export async function resetStudentProgress(userId: string) {
  await db.delete(studentProgress).where(eq(studentProgress.userId, userId));
  await db.delete(levelGraduations).where(eq(levelGraduations.userId, userId));
}
