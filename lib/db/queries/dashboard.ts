import { eq, and, count, desc, sql } from "drizzle-orm";
import { db } from "../index";
import {
  users,
  studentProgress,
  writtenSubmissions,
  qaThreads,
  qaMessages,
  lessons,
  levels,
} from "../schema";

export type DashboardStats = {
  activeStudents: number;
  pendingReviews: number;
  pendingQa: number;
  averageProgress: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const [{ total: activeStudents }] = await db
    .select({ total: count() })
    .from(users)
    .where(eq(users.role, "student"));

  const [{ total: pendingReviews }] = await db
    .select({ total: count() })
    .from(writtenSubmissions)
    .where(eq(writtenSubmissions.status, "submitted"));

  const [{ total: pendingQa }] = await db
    .select({ total: count() })
    .from(qaThreads)
    .where(eq(qaThreads.status, "open"));

  return {
    activeStudents,
    pendingReviews,
    pendingQa,
    averageProgress: 0,
  };
}

export async function getRecentSubmissions(limit = 5) {
  return db
    .select({
      submission: writtenSubmissions,
      studentName: users.name,
      lessonNumber: lessons.lessonNumber,
      levelId: lessons.levelId,
    })
    .from(writtenSubmissions)
    .innerJoin(users, eq(writtenSubmissions.userId, users.id))
    .innerJoin(lessons, eq(writtenSubmissions.lessonId, lessons.id))
    .where(eq(writtenSubmissions.status, "submitted"))
    .orderBy(desc(writtenSubmissions.submittedAt))
    .limit(limit);
}

export async function getRecentQaThreads(limit = 5) {
  return db
    .select({
      thread: qaThreads,
      studentName: users.name,
      lessonNumber: lessons.lessonNumber,
      levelId: lessons.levelId,
    })
    .from(qaThreads)
    .innerJoin(users, eq(qaThreads.userId, users.id))
    .innerJoin(lessons, eq(qaThreads.lessonId, lessons.id))
    .where(eq(qaThreads.status, "open"))
    .orderBy(desc(qaThreads.createdAt))
    .limit(limit);
}

export async function getRecentStudentActivity(limit = 8) {
  return db
    .select({
      studentName: users.name,
      studentId: users.id,
    })
    .from(users)
    .where(eq(users.role, "student"))
    .orderBy(desc(users.createdAt))
    .limit(limit);
}
