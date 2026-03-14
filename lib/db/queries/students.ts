import { eq, sql, and, count, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "../schema";

type StudentListParams = {
  search?: string;
  level?: number;
  limit?: number;
  offset?: number;
  sortBy?: "name" | "level" | "progress" | "lastActivity";
  sortDir?: "asc" | "desc";
};

export async function getStudentList(params: StudentListParams = {}) {
  const { search, level, limit = 50, offset = 0 } = params;

  const students = await db.query.users.findMany({
    where: (u, { eq: eq2, and: and2 }) => {
      const conditions = [eq2(u.role, "student")];
      if (search) {
        conditions.push(
          sql`(${u.name} ILIKE ${'%' + search + '%'} OR ${u.email} ILIKE ${'%' + search + '%'})` as unknown as SQL,
        );
      }
      return and2(...conditions);
    },
    limit,
    offset,
    orderBy: (u, { asc }) => [asc(u.name)],
  });

  const enriched = await Promise.all(
    students.map(async (student) => {
      const progress = await db
        .select()
        .from(schema.studentProgress)
        .where(eq(schema.studentProgress.userId, student.id));

      const graduations = await db
        .select()
        .from(schema.levelGraduations)
        .where(eq(schema.levelGraduations.userId, student.id));

      const graduatedLevels = graduations.map((g) => g.levelId);
      const currentLevel = graduatedLevels.length > 0
        ? Math.max(...graduatedLevels) + 1
        : student.startingLevel;

      const currentLevelLessons = await db.query.lessons.findMany({
        where: (l, { eq: eq2 }) => eq2(l.levelId, Math.min(currentLevel, 5)),
      });

      const completedLessons = progress.filter((p) => 
        p.audioListened && p.notesRead && p.quizPassed && p.writtenApproved
      );

      const totalLessons = currentLevelLessons.length || 1;
      const currentLevelProgress = progress.filter((p) =>
        currentLevelLessons.some((l) => l.id === p.lessonId)
      );
      const currentLevelCompleted = currentLevelProgress.filter((p) =>
        p.audioListened && p.notesRead && p.quizPassed && p.writtenApproved
      );
      const progressPercent = Math.round((currentLevelCompleted.length / totalLessons) * 100);

      const nextLesson = currentLevelLessons
        .sort((a, b) => a.lessonNumber - b.lessonNumber)
        .find((l) => !currentLevelProgress.some((p) => p.lessonId === l.id && p.audioListened && p.notesRead && p.quizPassed && p.writtenApproved));

      const openQa = await db
        .select({ count: count() })
        .from(schema.qaThreads)
        .where(and(eq(schema.qaThreads.userId, student.id), eq(schema.qaThreads.status, "open")));

      const pendingReviews = await db
        .select({ count: count() })
        .from(schema.writtenSubmissions)
        .where(and(eq(schema.writtenSubmissions.userId, student.id), eq(schema.writtenSubmissions.status, "submitted")));

      if (level && currentLevel !== level) return null;

      return {
        ...student,
        currentLevel: Math.min(currentLevel, 5),
        progressPercent,
        currentLesson: nextLesson ? `L${Math.min(currentLevel, 5)}.${nextLesson.lessonNumber}` : "Complete",
        qaPending: openQa[0]?.count ?? 0,
        reviewsPending: pendingReviews[0]?.count ?? 0,
        graduationStatus: currentLevelCompleted.length === totalLessons ? "ready" : "in_progress",
        completedLessons: completedLessons.length,
      };
    })
  );

  return enriched.filter(Boolean);
}

export async function getStudentById(userId: string) {
  const student = await db.query.users.findFirst({
    where: (u, { eq: eq2 }) => eq2(u.id, userId),
  });
  return student ?? null;
}

export async function getDashboardStats() {
  const [studentCount] = await db
    .select({ count: count() })
    .from(schema.users)
    .where(eq(schema.users.role, "student"));

  const [pendingReviews] = await db
    .select({ count: count() })
    .from(schema.writtenSubmissions)
    .where(eq(schema.writtenSubmissions.status, "submitted"));

  const [openQa] = await db
    .select({ count: count() })
    .from(schema.qaThreads)
    .where(eq(schema.qaThreads.status, "open"));

  const allProgress = await db.select().from(schema.studentProgress);
  const studentProgressMap = new Map<string, number[]>();
  for (const p of allProgress) {
    const arr = studentProgressMap.get(p.userId) || [];
    if (p.audioListened && p.notesRead && p.quizPassed && p.writtenApproved) {
      arr.push(1);
    }
    studentProgressMap.set(p.userId, arr);
  }

  let totalPercent = 0;
  let studentWithProgress = 0;
  for (const [, completed] of studentProgressMap) {
    if (completed.length > 0) {
      totalPercent += Math.min(completed.length * 20, 100);
      studentWithProgress++;
    }
  }

  return {
    activeStudents: studentCount?.count ?? 0,
    averageProgress: studentWithProgress > 0 ? Math.round(totalPercent / studentWithProgress) : 0,
    pendingReviews: pendingReviews?.count ?? 0,
    openQa: openQa?.count ?? 0,
  };
}
