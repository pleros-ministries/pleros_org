import { and, asc, eq, gte, inArray, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { lagosDayRange, type DailyParticipationRow } from "@/lib/sogp/daily-participation";

import * as schema from "../schema";

export async function getSogpDailyParticipation(
  cohortId: number,
  dateKey: string,
): Promise<DailyParticipationRow[]> {
  const { start, end } = lagosDayRange(dateKey);

  const [enrollments, trackRows] = await Promise.all([
    db
      .select({
        id: schema.sogpEnrollments.id,
        userId: schema.sogpEnrollments.userId,
        name: schema.sogpEnrollments.name,
        email: schema.sogpEnrollments.email,
        pastorId: schema.pastorAssignments.pastorUserId,
        pastorName: schema.users.name,
      })
      .from(schema.sogpEnrollments)
      .leftJoin(
        schema.pastorAssignments,
        eq(schema.pastorAssignments.enrollmentId, schema.sogpEnrollments.id),
      )
      .leftJoin(schema.users, eq(schema.users.id, schema.pastorAssignments.pastorUserId))
      .where(eq(schema.sogpEnrollments.cohortId, cohortId))
      .orderBy(asc(schema.sogpEnrollments.name)),
    db
      .select({
        lessonId: schema.sogpCohortTracks.lessonId,
        releaseAt: schema.sogpCohortTracks.releaseAt,
      })
      .from(schema.sogpCohortTracks)
      .where(eq(schema.sogpCohortTracks.cohortId, cohortId)),
  ]);

  if (!enrollments.length) return [];

  const userIds = enrollments.map((enrollment) => enrollment.userId);
  const cohortLessonIds = trackRows.map((track) => track.lessonId);
  const dayLessonIds = trackRows
    .filter((track) => track.releaseAt >= start && track.releaseAt < end)
    .map((track) => track.lessonId);

  const [prayer, reviews, quizzes, submitted, approved, listenedRows] = await Promise.all([
    db
      .select({ userId: schema.prayerWatchAttendance.userId })
      .from(schema.prayerWatchAttendance)
      .where(
        and(
          eq(schema.prayerWatchAttendance.attendedDate, dateKey),
          eq(schema.prayerWatchAttendance.session, "morning"),
          inArray(schema.prayerWatchAttendance.userId, userIds),
        ),
      ),
    db
      .select({ userId: schema.sogpLiveClassAttendance.userId })
      .from(schema.sogpLiveClassAttendance)
      .innerJoin(
        schema.sogpLiveClasses,
        eq(schema.sogpLiveClasses.id, schema.sogpLiveClassAttendance.liveClassId),
      )
      .where(
        and(
          eq(schema.sogpLiveClasses.cohortId, cohortId),
          gte(schema.sogpLiveClassAttendance.attendedAt, start),
          lt(schema.sogpLiveClassAttendance.attendedAt, end),
          inArray(schema.sogpLiveClassAttendance.userId, userIds),
        ),
      ),
    cohortLessonIds.length
      ? db
          .select({ userId: schema.quizAttempts.userId })
          .from(schema.quizAttempts)
          .where(
            and(
              gte(schema.quizAttempts.createdAt, start),
              lt(schema.quizAttempts.createdAt, end),
              inArray(schema.quizAttempts.lessonId, cohortLessonIds),
              inArray(schema.quizAttempts.userId, userIds),
            ),
          )
      : Promise.resolve([]),
    cohortLessonIds.length
      ? db
          .select({ userId: schema.writtenSubmissions.userId })
          .from(schema.writtenSubmissions)
          .where(
            and(
              gte(schema.writtenSubmissions.submittedAt, start),
              lt(schema.writtenSubmissions.submittedAt, end),
              inArray(schema.writtenSubmissions.lessonId, cohortLessonIds),
              inArray(schema.writtenSubmissions.userId, userIds),
            ),
          )
      : Promise.resolve([]),
    cohortLessonIds.length
      ? db
          .select({ userId: schema.writtenSubmissions.userId })
          .from(schema.writtenSubmissions)
          .where(
            and(
              eq(schema.writtenSubmissions.status, "approved"),
              gte(schema.writtenSubmissions.reviewedAt, start),
              lt(schema.writtenSubmissions.reviewedAt, end),
              inArray(schema.writtenSubmissions.lessonId, cohortLessonIds),
              inArray(schema.writtenSubmissions.userId, userIds),
            ),
          )
      : Promise.resolve([]),
    dayLessonIds.length
      ? db
          .select({ userId: schema.studentProgress.userId })
          .from(schema.studentProgress)
          .where(
            and(
              eq(schema.studentProgress.audioListened, true),
              inArray(schema.studentProgress.lessonId, dayLessonIds),
              inArray(schema.studentProgress.userId, userIds),
            ),
          )
      : Promise.resolve([]),
  ]);

  const ids = (rows: Array<{ userId: string }>) => new Set(rows.map((row) => row.userId));
  const prayerIds = ids(prayer);
  const reviewIds = ids(reviews);
  const quizIds = ids(quizzes);
  const submittedIds = ids(submitted);
  const approvedIds = ids(approved);
  const listenedIds = ids(listenedRows);

  return enrollments.map((enrollment) => ({
    enrollmentId: enrollment.id,
    name: enrollment.name,
    email: enrollment.email,
    pastorId: enrollment.pastorId,
    pastorName: enrollment.pastorId ? (enrollment.pastorName ?? "Unknown pastor") : null,
    prayerWatch: prayerIds.has(enrollment.userId),
    listened: dayLessonIds.length ? listenedIds.has(enrollment.userId) : null,
    quizAttempted: quizIds.has(enrollment.userId),
    writtenSubmitted: submittedIds.has(enrollment.userId),
    writtenApproved: approvedIds.has(enrollment.userId),
    reviewAttended: reviewIds.has(enrollment.userId),
  }));
}
