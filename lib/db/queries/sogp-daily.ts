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
  filter: { pastorId?: string; enrollmentIds?: number[] } = {},
): Promise<RangeParticipationRow[]> {
  const { pastorId, enrollmentIds } = filter;
  if (enrollmentIds && enrollmentIds.length === 0) return [];
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
          enrollmentIds ? inArray(schema.sogpEnrollments.id, enrollmentIds) : undefined,
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
  enrollees: StatusEnrollee[],
): Promise<Map<number, StudentStatus>> {
  return getStudentStatusesForEnrollments(enrollees, { pastorId: pastorUserId });
}

type StatusEnrollee = { enrollmentId: number; cohortId: number; enrollmentCreatedAt: Date };

/**
 * Same classification for an explicit set of enrolments (e.g. a discipler's
 * disciples). Without a pastor filter the range query is narrowed to exactly
 * these enrolments.
 */
export async function getStudentStatusesForEnrollments(
  enrollees: StatusEnrollee[],
  filter: { pastorId?: string } = {},
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
        filter.pastorId
          ? { pastorId: filter.pastorId }
          : { enrollmentIds: enrollees.map((enrollee) => enrollee.enrollmentId) },
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

export type EnrolleePerformanceDay = {
  dateKey: string;
  /** "Pre-SOGP day N" or "Week W · Day D"; null when nothing was scheduled. */
  label: string | null;
  /** Each activity is null when it wasn't scheduled that day. */
  prep: boolean | null;
  listened: boolean | null;
  prayerWatch: boolean;
  review: boolean | null;
  /** Best quiz score (%) recorded that day, or null for no attempt. */
  quizScore: number | null;
  responseSubmitted: boolean;
  completed: number;
  applicable: number;
};

export type EnrolleePerformance = {
  enrollee: {
    enrollmentId: number;
    name: string;
    email: string;
    phone: string;
    country: string;
    region: string;
    birthYear: number | null;
    referralSource: string;
    whatsappConsent: boolean;
    enrollmentStatus: string;
    createdAt: string;
    cohortTitle: string;
    pastorName: string | null;
  };
  status: StudentStatus;
  todayKey: string;
  /** Newest first. */
  days: EnrolleePerformanceDay[];
};

/**
 * One enrollee's day-by-day performance, from the later of their programme
 * start (Pre-SOGP day 1, else cohort start) and their enrolment date through
 * today or cohort end. Reuses `getSogpParticipationRange` for teaching,
 * morning prayer and review, then layers Pre-SOGP, quiz and written-response
 * activity on top.
 */
export async function getSogpEnrolleePerformance(
  enrollmentId: number,
): Promise<EnrolleePerformance | null> {
  const [row] = await db
    .select({
      enrollment: schema.sogpEnrollments,
      cohort: schema.sogpCohorts,
      pastorName: schema.users.name,
    })
    .from(schema.sogpEnrollments)
    .innerJoin(schema.sogpCohorts, eq(schema.sogpCohorts.id, schema.sogpEnrollments.cohortId))
    .leftJoin(
      schema.pastorAssignments,
      eq(schema.pastorAssignments.enrollmentId, schema.sogpEnrollments.id),
    )
    .leftJoin(schema.users, eq(schema.users.id, schema.pastorAssignments.pastorUserId))
    .where(eq(schema.sogpEnrollments.id, enrollmentId))
    .limit(1);
  if (!row) return null;

  const { enrollment, cohort } = row;
  const [prepDays, trackRows, statuses] = await Promise.all([
    db
      .select({ id: schema.sogpPreparationDays.id, publishDate: schema.sogpPreparationDays.publishDate })
      .from(schema.sogpPreparationDays)
      .where(
        and(
          eq(schema.sogpPreparationDays.cohortId, cohort.id),
          eq(schema.sogpPreparationDays.status, "published"),
        ),
      )
      .orderBy(asc(schema.sogpPreparationDays.publishDate)),
    db
      .select({
        lessonId: schema.sogpCohortTracks.lessonId,
        releaseAt: schema.sogpCohortTracks.releaseAt,
        weekNumber: schema.sogpCohortTracks.weekNumber,
        dayNumber: schema.sogpCohortTracks.dayNumber,
      })
      .from(schema.sogpCohortTracks)
      .where(eq(schema.sogpCohortTracks.cohortId, cohort.id)),
    getStudentStatusesForEnrollments([
      { enrollmentId, cohortId: cohort.id, enrollmentCreatedAt: enrollment.createdAt },
    ]),
  ]);

  const programmeStartKey =
    prepDays[0]?.publishDate ??
    (cohort.preparationStartsAt ? toLagosDateKey(cohort.preparationStartsAt) : null) ??
    toLagosDateKey(cohort.startsAt);
  const enrolledKey = toLagosDateKey(enrollment.createdAt);
  const startKey = enrolledKey > programmeStartKey ? enrolledKey : programmeStartKey;
  const todayKey = toLagosDateKey(new Date());
  const cohortEndKey = toLagosDateKey(cohort.endsAt);
  const endKey = todayKey < cohortEndKey ? todayKey : cohortEndKey;

  const base = {
    enrollee: {
      enrollmentId,
      name: enrollment.name,
      email: enrollment.email,
      phone: enrollment.phone,
      country: enrollment.country,
      region: enrollment.region,
      birthYear: enrollment.birthYear,
      referralSource: enrollment.referralSource,
      whatsappConsent: enrollment.whatsappConsent,
      enrollmentStatus: enrollment.status,
      createdAt: enrollment.createdAt.toISOString(),
      cohortTitle: cohort.title,
      pastorName: row.pastorName ?? null,
    },
    status: statuses.get(enrollmentId) ?? "on_track",
    todayKey,
  } satisfies Omit<EnrolleePerformance, "days">;

  if (startKey > endKey) return { ...base, days: [] };

  const { start, end } = lagosRange(startKey, endKey);
  const cohortLessonIds = trackRows.map((track) => track.lessonId);
  const prepDayIds = prepDays.map((day) => day.id);

  const [participation, prepCompletions, quizRows, responseRows] = await Promise.all([
    getSogpParticipationRange(cohort.id, startKey, endKey, { enrollmentIds: [enrollmentId] }),
    prepDayIds.length
      ? db
          .select({ preparationDayId: schema.sogpPreparationCompletions.preparationDayId })
          .from(schema.sogpPreparationCompletions)
          .where(
            and(
              eq(schema.sogpPreparationCompletions.enrollmentId, enrollmentId),
              inArray(schema.sogpPreparationCompletions.preparationDayId, prepDayIds),
            ),
          )
      : Promise.resolve([]),
    cohortLessonIds.length
      ? db
          .select({ score: schema.quizAttempts.score, createdAt: schema.quizAttempts.createdAt })
          .from(schema.quizAttempts)
          .where(
            and(
              eq(schema.quizAttempts.userId, enrollment.userId),
              inArray(schema.quizAttempts.lessonId, cohortLessonIds),
              gte(schema.quizAttempts.createdAt, start),
              lt(schema.quizAttempts.createdAt, end),
            ),
          )
      : Promise.resolve([]),
    cohortLessonIds.length
      ? db
          .select({ submittedAt: schema.writtenSubmissions.submittedAt })
          .from(schema.writtenSubmissions)
          .where(
            and(
              eq(schema.writtenSubmissions.userId, enrollment.userId),
              inArray(schema.writtenSubmissions.lessonId, cohortLessonIds),
              gte(schema.writtenSubmissions.submittedAt, start),
              lt(schema.writtenSubmissions.submittedAt, end),
            ),
          )
      : Promise.resolve([]),
  ]);

  const prepDayByDate = new Map(prepDays.map((day, index) => [day.publishDate, { id: day.id, number: index + 1 }]));
  const completedPrepIds = new Set(prepCompletions.map((item) => item.preparationDayId));
  const trackByDate = new Map(trackRows.map((track) => [toLagosDateKey(track.releaseAt), track]));
  const bestQuizByDate = new Map<string, number>();
  for (const attempt of quizRows) {
    const key = toLagosDateKey(attempt.createdAt);
    bestQuizByDate.set(key, Math.max(bestQuizByDate.get(key) ?? 0, attempt.score));
  }
  const responseDates = new Set(
    responseRows.flatMap((item) => (item.submittedAt ? [toLagosDateKey(item.submittedAt)] : [])),
  );
  const participationByDate = new Map(participation.map((item) => [item.dateKey, item]));

  const days = enumerateDateKeys(startKey, endKey).map((dateKey): EnrolleePerformanceDay => {
    const prepDay = prepDayByDate.get(dateKey);
    const track = trackByDate.get(dateKey);
    const day = participationByDate.get(dateKey);
    const prep = prepDay ? completedPrepIds.has(prepDay.id) : null;
    const listened = day?.listened ?? null;
    const prayerWatch = day?.prayerWatch ?? false;
    const review = day?.reviewAttended ?? null;
    const activities = [prep, listened, prayerWatch, review].filter(
      (value): value is boolean => value !== null,
    );
    return {
      dateKey,
      label: track
        ? `Week ${track.weekNumber}${track.dayNumber ? ` · Day ${track.dayNumber}` : ""}`
        : prepDay
          ? `Pre-SOGP day ${prepDay.number}`
          : null,
      prep,
      listened,
      prayerWatch,
      review,
      quizScore: bestQuizByDate.get(dateKey) ?? null,
      responseSubmitted: responseDates.has(dateKey),
      completed: activities.filter(Boolean).length,
      applicable: activities.length,
    };
  });

  return { ...base, days: days.reverse() };
}

/** Automatic status for every enrollee a pastor holds in one cohort — powers
 * the Status column on the pastor's daily participation table. */
export async function getPastorCohortStatuses(
  cohortId: number,
  pastorId: string,
): Promise<Record<number, StudentStatus>> {
  const enrollments = await db
    .select({
      enrollmentId: schema.sogpEnrollments.id,
      cohortId: schema.sogpEnrollments.cohortId,
      enrollmentCreatedAt: schema.sogpEnrollments.createdAt,
    })
    .from(schema.sogpEnrollments)
    .innerJoin(
      schema.pastorAssignments,
      eq(schema.pastorAssignments.enrollmentId, schema.sogpEnrollments.id),
    )
    .where(
      and(
        eq(schema.sogpEnrollments.cohortId, cohortId),
        eq(schema.pastorAssignments.pastorUserId, pastorId),
      ),
    );
  const statuses = await getStudentStatusesForPastor(pastorId, enrollments);
  return Object.fromEntries(statuses);
}
