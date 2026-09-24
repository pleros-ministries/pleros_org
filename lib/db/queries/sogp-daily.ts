import { and, asc, eq, gte, inArray, lt, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  enumerateDateKeys,
  lagosDayRange,
  lagosRange,
  toLagosDateKey,
  type DailyParticipationRow,
  type RangeParticipationRow,
} from "@/lib/sogp/daily-participation";
import {
  buildStudentDayRecords,
  classifyStudentStatus,
  clipWindowStart,
  LOOKBACK_DAYS,
  type StudentStatus,
} from "@/lib/sogp/student-status";

import * as schema from "../schema";

export async function getSogpDailyParticipation(
  cohortId: number,
  dateKey: string,
  pastorId?: string,
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
      .where(
        and(
          eq(schema.sogpEnrollments.cohortId, cohortId),
          pastorId ? eq(schema.pastorAssignments.pastorUserId, pastorId) : undefined,
        ),
      )
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

/**
 * Same three activities as `getSogpDailyParticipation` (teaching, morning
 * prayer, review), but across every day from `startDateKey` through
 * `endDateKey` inclusive — the shape `classifyStudentStatus` needs to judge
 * a pattern instead of a single day. Every enrollee gets one row per day in
 * range, including days with zero participation, so callers can walk
 * consecutive-day streaks without gaps.
 */
export async function getSogpParticipationRange(
  cohortId: number,
  startDateKey: string,
  endDateKey: string,
  pastorId?: string,
): Promise<RangeParticipationRow[]> {
  const { start, end } = lagosRange(startDateKey, endDateKey);
  const dateKeys = enumerateDateKeys(startDateKey, endDateKey);

  const [enrollments, trackRows] = await Promise.all([
    db
      .select({ id: schema.sogpEnrollments.id, userId: schema.sogpEnrollments.userId })
      .from(schema.sogpEnrollments)
      .leftJoin(
        schema.pastorAssignments,
        eq(schema.pastorAssignments.enrollmentId, schema.sogpEnrollments.id),
      )
      .where(
        and(
          eq(schema.sogpEnrollments.cohortId, cohortId),
          pastorId ? eq(schema.pastorAssignments.pastorUserId, pastorId) : undefined,
        ),
      ),
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

  // Lessons released within the range, bucketed by day; a day with nothing
  // in `lessonIdsByDay` means teaching wasn't applicable that day.
  const lessonIdsByDay = new Map<string, number[]>();
  const dayByLessonId = new Map<number, string>();
  for (const track of trackRows) {
    if (track.releaseAt < start || track.releaseAt >= end) continue;
    const dateKey = toLagosDateKey(track.releaseAt);
    const bucket = lessonIdsByDay.get(dateKey);
    if (bucket) bucket.push(track.lessonId);
    else lessonIdsByDay.set(dateKey, [track.lessonId]);
    dayByLessonId.set(track.lessonId, dateKey);
  }
  const rangeLessonIdList = [...dayByLessonId.keys()];

  const [prayerRows, liveClassRows, attendanceRows, listenedRows] = await Promise.all([
    db
      .select({
        userId: schema.prayerWatchAttendance.userId,
        dateKey: schema.prayerWatchAttendance.attendedDate,
      })
      .from(schema.prayerWatchAttendance)
      .where(
        and(
          gte(schema.prayerWatchAttendance.attendedDate, startDateKey),
          lte(schema.prayerWatchAttendance.attendedDate, endDateKey),
          eq(schema.prayerWatchAttendance.session, "morning"),
          inArray(schema.prayerWatchAttendance.userId, userIds),
        ),
      ),
    db
      .select({ startsAt: schema.sogpLiveClasses.startsAt })
      .from(schema.sogpLiveClasses)
      .where(
        and(
          eq(schema.sogpLiveClasses.cohortId, cohortId),
          gte(schema.sogpLiveClasses.startsAt, start),
          lt(schema.sogpLiveClasses.startsAt, end),
        ),
      ),
    db
      .select({
        userId: schema.sogpLiveClassAttendance.userId,
        attendedAt: schema.sogpLiveClassAttendance.attendedAt,
      })
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
    rangeLessonIdList.length
      ? db
          .select({
            userId: schema.studentProgress.userId,
            lessonId: schema.studentProgress.lessonId,
          })
          .from(schema.studentProgress)
          .where(
            and(
              eq(schema.studentProgress.audioListened, true),
              inArray(schema.studentProgress.lessonId, rangeLessonIdList),
              inArray(schema.studentProgress.userId, userIds),
            ),
          )
      : Promise.resolve([]),
  ]);

  const reviewDayKeys = new Set(liveClassRows.map((row) => toLagosDateKey(row.startsAt)));
  const prayerSet = new Set(prayerRows.map((row) => `${row.userId}:${row.dateKey}`));
  const reviewSet = new Set(
    attendanceRows.map((row) => `${row.userId}:${toLagosDateKey(row.attendedAt)}`),
  );
  const listenedSet = new Set(
    listenedRows
      .map((row) => {
        const dateKey = dayByLessonId.get(row.lessonId);
        return dateKey ? `${row.userId}:${dateKey}` : null;
      })
      .filter((key): key is string => key !== null),
  );

  const result: RangeParticipationRow[] = [];
  for (const enrollment of enrollments) {
    for (const dateKey of dateKeys) {
      const dayLessonIds = lessonIdsByDay.get(dateKey);
      const reviewApplicable = reviewDayKeys.has(dateKey);
      result.push({
        enrollmentId: enrollment.id,
        dateKey,
        listened: dayLessonIds ? listenedSet.has(`${enrollment.userId}:${dateKey}`) : null,
        prayerWatch: prayerSet.has(`${enrollment.userId}:${dateKey}`),
        reviewApplicable,
        reviewAttended: reviewApplicable
          ? reviewSet.has(`${enrollment.userId}:${dateKey}`)
          : null,
      });
    }
  }
  return result;
}

/**
 * Computes each enrollee's automatic student status (see `lib/sogp/student-status.ts`)
 * from recent participation. Batches the range query once per distinct
 * cohort — not once per enrollee — since a pastor's list is usually one or a
 * handful of cohorts even when it holds many students.
 */
export async function getStudentStatusesForPastor(
  pastorUserId: string,
  enrollees: Array<{ enrollmentId: number; cohortId: number; enrollmentCreatedAt: Date }>,
): Promise<Map<number, StudentStatus>> {
  if (!enrollees.length) return new Map();

  const cohortIds = [...new Set(enrollees.map((enrollee) => enrollee.cohortId))];
  const cohortRows = await db
    .select({ id: schema.sogpCohorts.id, startsAt: schema.sogpCohorts.startsAt })
    .from(schema.sogpCohorts)
    .where(inArray(schema.sogpCohorts.id, cohortIds));
  const cohortStartsById = new Map(cohortRows.map((row) => [row.id, row.startsAt]));

  const todayKey = toLagosDateKey(new Date());
  const lookbackStartKey = toLagosDateKey(
    new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000),
  );

  const rowsByCohort = new Map<number, RangeParticipationRow[]>();
  await Promise.all(
    cohortIds.map(async (cohortId) => {
      const rows = await getSogpParticipationRange(
        cohortId,
        lookbackStartKey,
        todayKey,
        pastorUserId,
      );
      rowsByCohort.set(cohortId, rows);
    }),
  );

  const statuses = new Map<number, StudentStatus>();
  for (const enrollee of enrollees) {
    const rows = rowsByCohort.get(enrollee.cohortId) ?? [];
    const cohortStartsAt = cohortStartsById.get(enrollee.cohortId) ?? enrollee.enrollmentCreatedAt;
    const clippedStart = clipWindowStart(
      enrollee.enrollmentCreatedAt,
      cohortStartsAt,
      lookbackStartKey,
    );
    const days = buildStudentDayRecords(rows, enrollee.enrollmentId).filter(
      (day) => day.dateKey >= clippedStart,
    );
    statuses.set(enrollee.enrollmentId, classifyStudentStatus(days));
  }
  return statuses;
}
