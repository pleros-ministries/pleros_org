import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";

import * as schema from "../schema";

export type SogpRosterEnrollment = {
  enrollmentId: number;
  userId: string;
  name: string;
  email: string;
  status: string;
};

async function getSogpCohortEnrollmentsForRoster(cohortId: number): Promise<SogpRosterEnrollment[]> {
  const rows = await db
    .select({
      id: schema.sogpEnrollments.id,
      userId: schema.sogpEnrollments.userId,
      name: schema.sogpEnrollments.name,
      email: schema.sogpEnrollments.email,
      status: schema.sogpEnrollments.status,
    })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.cohortId, cohortId))
    .orderBy(asc(schema.sogpEnrollments.name));

  return rows.map((row) => ({
    enrollmentId: row.id,
    userId: row.userId,
    name: row.name,
    email: row.email,
    status: row.status,
  }));
}

export type SogpLessonRosterEntry = SogpRosterEnrollment & {
  audioListened: boolean;
  notesRead: boolean;
  quizPassed: boolean;
  highestQuizScore: number | null;
  writtenApproved: boolean;
};

export async function getSogpLessonRoster(cohortId: number, lessonId: number): Promise<SogpLessonRosterEntry[]> {
  const enrollments = await getSogpCohortEnrollmentsForRoster(cohortId);
  const userIds = enrollments.map((enrollment) => enrollment.userId);
  if (!userIds.length) return [];

  const progressRows = await db
    .select()
    .from(schema.studentProgress)
    .where(and(eq(schema.studentProgress.lessonId, lessonId), inArray(schema.studentProgress.userId, userIds)));
  const progressByUser = new Map(progressRows.map((row) => [row.userId, row]));

  return enrollments.map((enrollment) => {
    const progress = progressByUser.get(enrollment.userId);
    return {
      ...enrollment,
      audioListened: progress?.audioListened ?? false,
      notesRead: progress?.notesRead ?? false,
      quizPassed: progress?.quizPassed ?? false,
      highestQuizScore: progress?.highestQuizScore ?? null,
      writtenApproved: progress?.writtenApproved ?? false,
    };
  });
}

export type SogpPrayerWatchRosterEntry = SogpRosterEnrollment & { attended: boolean };

export async function getSogpPrayerWatchRoster(cohortId: number, date: string): Promise<SogpPrayerWatchRosterEntry[]> {
  const enrollments = await getSogpCohortEnrollmentsForRoster(cohortId);
  const userIds = enrollments.map((enrollment) => enrollment.userId);
  if (!userIds.length) return [];

  const rows = await db
    .select({ userId: schema.prayerWatchAttendance.userId })
    .from(schema.prayerWatchAttendance)
    .where(
      and(
        eq(schema.prayerWatchAttendance.attendedDate, date),
        eq(schema.prayerWatchAttendance.session, "morning"),
        inArray(schema.prayerWatchAttendance.userId, userIds),
      ),
    );
  const attendedUserIds = new Set(rows.map((row) => row.userId));

  return enrollments.map((enrollment) => ({
    ...enrollment,
    attended: attendedUserIds.has(enrollment.userId),
  }));
}

export type SogpLiveClassRosterEntry = SogpRosterEnrollment & {
  attended: boolean;
  attendedAt: Date | null;
  completionSource: "live" | "recording" | null;
};

export async function getSogpLiveClassRoster(
  cohortId: number,
  liveClassId: number,
): Promise<SogpLiveClassRosterEntry[]> {
  const enrollments = await getSogpCohortEnrollmentsForRoster(cohortId);
  const userIds = enrollments.map((enrollment) => enrollment.userId);
  if (!userIds.length) return [];

  const rows = await db
    .select()
    .from(schema.sogpLiveClassAttendance)
    .where(
      and(
        eq(schema.sogpLiveClassAttendance.liveClassId, liveClassId),
        inArray(schema.sogpLiveClassAttendance.userId, userIds),
      ),
    );
  const attendanceByUser = new Map(rows.map((row) => [row.userId, row]));

  return enrollments.map((enrollment) => {
    const attendance = attendanceByUser.get(enrollment.userId);
    return {
      ...enrollment,
      attended: Boolean(attendance),
      attendedAt: attendance?.attendedAt ?? null,
      completionSource: attendance?.completionSource ?? null,
    };
  });
}
