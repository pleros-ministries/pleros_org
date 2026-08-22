import { eq, sql, and, count, inArray, asc, type SQL } from "drizzle-orm";
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

export async function getStudentPlatformList(limit = 200) {
  return db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      currentLevel: sql<number>`least(coalesce(max(${schema.levelGraduations.levelId}) + 1, ${schema.users.startingLevel}), 5)`,
    })
    .from(schema.users)
    .leftJoin(
      schema.levelGraduations,
      eq(schema.levelGraduations.userId, schema.users.id),
    )
    .where(eq(schema.users.role, "student"))
    .groupBy(
      schema.users.id,
      schema.users.name,
      schema.users.email,
      schema.users.startingLevel,
    )
    .orderBy(asc(schema.users.name))
    .limit(limit);
}

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

  if (students.length === 0) {
    return [];
  }

  const studentIds = students.map((student) => student.id);
  const [
    progressRows,
    graduationRows,
    lessonRows,
    openQaRows,
    pendingReviewRows,
  ] = await Promise.all([
    db
      .select()
      .from(schema.studentProgress)
      .where(inArray(schema.studentProgress.userId, studentIds)),
    db
      .select()
      .from(schema.levelGraduations)
      .where(inArray(schema.levelGraduations.userId, studentIds)),
    db.query.lessons.findMany(),
    db
      .select({
        userId: schema.qaThreads.userId,
        count: count(),
      })
      .from(schema.qaThreads)
      .where(
        and(
          inArray(schema.qaThreads.userId, studentIds),
          eq(schema.qaThreads.status, "open"),
        ),
      )
      .groupBy(schema.qaThreads.userId),
    db
      .select({
        userId: schema.writtenSubmissions.userId,
        count: count(),
      })
      .from(schema.writtenSubmissions)
      .where(
        and(
          inArray(schema.writtenSubmissions.userId, studentIds),
          eq(schema.writtenSubmissions.status, "submitted"),
        ),
      )
      .groupBy(schema.writtenSubmissions.userId),
  ]);

  const progressByUserId = new Map<string, typeof progressRows>();
  for (const progress of progressRows) {
    const rows = progressByUserId.get(progress.userId) ?? [];
    rows.push(progress);
    progressByUserId.set(progress.userId, rows);
  }

  const graduationsByUserId = new Map<string, typeof graduationRows>();
  for (const graduation of graduationRows) {
    const rows = graduationsByUserId.get(graduation.userId) ?? [];
    rows.push(graduation);
    graduationsByUserId.set(graduation.userId, rows);
  }

  const lessonsByLevel = new Map<number, typeof lessonRows>();
  for (const lesson of lessonRows) {
    const rows = lessonsByLevel.get(lesson.levelId) ?? [];
    rows.push(lesson);
    lessonsByLevel.set(lesson.levelId, rows);
  }
  for (const rows of lessonsByLevel.values()) {
    rows.sort((a, b) => a.lessonNumber - b.lessonNumber);
  }

  const openQaByUserId = new Map(
    openQaRows.map((row) => [row.userId, row.count]),
  );
  const pendingReviewsByUserId = new Map(
    pendingReviewRows.map((row) => [row.userId, row.count]),
  );

  const enriched = students.map((student) => {
    const progress = progressByUserId.get(student.id) ?? [];
    const graduations = graduationsByUserId.get(student.id) ?? [];
    const graduatedLevels = graduations.map((g) => g.levelId);
    const currentLevel = graduatedLevels.length > 0
      ? Math.max(...graduatedLevels) + 1
      : student.startingLevel;
    const cappedCurrentLevel = Math.min(currentLevel, 5);
    const currentLevelLessons = lessonsByLevel.get(cappedCurrentLevel) ?? [];

    const completedLessons = progress.filter((p) =>
      p.audioListened && p.notesRead && p.quizPassed && p.writtenApproved
    );
    const currentLevelLessonIds = new Set(
      currentLevelLessons.map((lesson) => lesson.id),
    );
    const currentLevelProgress = progress.filter((p) =>
      currentLevelLessonIds.has(p.lessonId)
    );
    const completedLessonIds = new Set(
      currentLevelProgress
        .filter((p) =>
          p.audioListened && p.notesRead && p.quizPassed && p.writtenApproved
        )
        .map((p) => p.lessonId),
    );

    const totalLessons = currentLevelLessons.length || 1;
    const progressPercent = Math.round((completedLessonIds.size / totalLessons) * 100);
    const nextLesson = currentLevelLessons.find(
      (lesson) => !completedLessonIds.has(lesson.id),
    );

    if (level && cappedCurrentLevel !== level) return null;

    return {
      ...student,
      currentLevel: cappedCurrentLevel,
      progressPercent,
      currentLesson: nextLesson ? `L${cappedCurrentLevel}.${nextLesson.lessonNumber}` : "Complete",
      qaPending: openQaByUserId.get(student.id) ?? 0,
      reviewsPending: pendingReviewsByUserId.get(student.id) ?? 0,
      graduationStatus: completedLessonIds.size === totalLessons ? "ready" : "in_progress",
      completedLessons: completedLessons.length,
    };
  });

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
