import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";

import * as schema from "../schema";

export type SogpReportRawData = {
  cohorts: Array<typeof schema.sogpCohorts.$inferSelect>;
  enrollments: Array<typeof schema.sogpEnrollments.$inferSelect>;
  tracks: Array<{
    track: typeof schema.sogpCohortTracks.$inferSelect;
    lesson: { id: number; responsePrompt: string | null };
  }>;
  progress: Array<{
    userId: string;
    lessonId: number;
    quizPassed: boolean;
    writtenApproved: boolean;
  }>;
  quizAttempts: Array<{ userId: string; lessonId: number; createdAt: Date }>;
  writtenSubmissions: Array<{
    userId: string;
    lessonId: number;
    submittedAt: Date | null;
    reviewedAt: Date | null;
    createdAt: Date;
  }>;
  liveClasses: Array<typeof schema.sogpLiveClasses.$inferSelect>;
  liveClassAttendance: Array<{
    liveClassId: number;
    userId: string;
    attendedAt: Date;
  }>;
  prayerWatchAttendance: Array<{ userId: string; attendedDate: string }>;
  preparationDays: Array<{ id: number; cohortId: number; status: "draft" | "published" }>;
  preparationCompletions: Array<{ enrollmentId: number; completedAt: Date }>;
  certificates: Array<{
    enrollmentId: number;
    issuedAt: Date;
    revokedAt: Date | null;
  }>;
};

export async function getSogpReportData(): Promise<SogpReportRawData> {
  const [cohorts, enrollments, trackRows, liveClasses] = await Promise.all([
    db.select().from(schema.sogpCohorts).orderBy(desc(schema.sogpCohorts.startsAt)),
    db.select().from(schema.sogpEnrollments).orderBy(desc(schema.sogpEnrollments.createdAt)),
    db
      .select({
        track: schema.sogpCohortTracks,
        lesson: {
          id: schema.lessons.id,
          responsePrompt: schema.lessons.responsePrompt,
        },
      })
      .from(schema.sogpCohortTracks)
      .innerJoin(schema.lessons, eq(schema.sogpCohortTracks.lessonId, schema.lessons.id))
      .orderBy(asc(schema.sogpCohortTracks.curriculumOrder)),
    db.select().from(schema.sogpLiveClasses).orderBy(asc(schema.sogpLiveClasses.startsAt)),
  ]);

  const lessonIds = Array.from(new Set(trackRows.map((row) => row.lesson.id)));
  const liveClassIds = liveClasses.map((liveClass) => liveClass.id);
  const userIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.userId)));

  const [
    progress,
    quizAttempts,
    writtenSubmissions,
    liveClassAttendance,
    prayerWatchAttendance,
    preparationDays,
    preparationCompletions,
    certificates,
  ] = await Promise.all([
    lessonIds.length
      ? db
          .select({
            userId: schema.studentProgress.userId,
            lessonId: schema.studentProgress.lessonId,
            quizPassed: schema.studentProgress.quizPassed,
            writtenApproved: schema.studentProgress.writtenApproved,
          })
          .from(schema.studentProgress)
          .where(inArray(schema.studentProgress.lessonId, lessonIds))
      : Promise.resolve([]),
    lessonIds.length
      ? db
          .select({
            userId: schema.quizAttempts.userId,
            lessonId: schema.quizAttempts.lessonId,
            createdAt: schema.quizAttempts.createdAt,
          })
          .from(schema.quizAttempts)
          .where(inArray(schema.quizAttempts.lessonId, lessonIds))
      : Promise.resolve([]),
    lessonIds.length
      ? db
          .select({
            userId: schema.writtenSubmissions.userId,
            lessonId: schema.writtenSubmissions.lessonId,
            submittedAt: schema.writtenSubmissions.submittedAt,
            reviewedAt: schema.writtenSubmissions.reviewedAt,
            createdAt: schema.writtenSubmissions.createdAt,
          })
          .from(schema.writtenSubmissions)
          .where(inArray(schema.writtenSubmissions.lessonId, lessonIds))
      : Promise.resolve([]),
    liveClassIds.length
      ? db
          .select({
            liveClassId: schema.sogpLiveClassAttendance.liveClassId,
            userId: schema.sogpLiveClassAttendance.userId,
            attendedAt: schema.sogpLiveClassAttendance.attendedAt,
          })
          .from(schema.sogpLiveClassAttendance)
          .where(inArray(schema.sogpLiveClassAttendance.liveClassId, liveClassIds))
      : Promise.resolve([]),
    userIds.length
      ? db
          .select({
            userId: schema.prayerWatchAttendance.userId,
            attendedDate: schema.prayerWatchAttendance.attendedDate,
          })
          .from(schema.prayerWatchAttendance)
          .where(
            and(
              eq(schema.prayerWatchAttendance.session, "morning"),
              inArray(schema.prayerWatchAttendance.userId, userIds),
            ),
          )
      : Promise.resolve([]),
    db
      .select({
        id: schema.sogpPreparationDays.id,
        cohortId: schema.sogpPreparationDays.cohortId,
        status: schema.sogpPreparationDays.status,
      })
      .from(schema.sogpPreparationDays),
    db
      .select({
        enrollmentId: schema.sogpPreparationCompletions.enrollmentId,
        completedAt: schema.sogpPreparationCompletions.completedAt,
      })
      .from(schema.sogpPreparationCompletions),
    db
      .select({
        enrollmentId: schema.sogpCertificates.enrollmentId,
        issuedAt: schema.sogpCertificates.issuedAt,
        revokedAt: schema.sogpCertificates.revokedAt,
      })
      .from(schema.sogpCertificates),
  ]);

  return {
    cohorts,
    enrollments,
    tracks: trackRows,
    progress,
    quizAttempts,
    writtenSubmissions,
    liveClasses,
    liveClassAttendance,
    prayerWatchAttendance,
    preparationDays,
    preparationCompletions,
    certificates,
  };
}
