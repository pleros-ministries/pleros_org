import { SOGP_TOTAL_WEEKS, getSogpCohortWeek } from "./calendar";

import type { SogpReportRawData } from "@/lib/db/queries/sogp-report";
import type {
  AdminSogpReportCohort,
  AdminSogpReportData,
  AdminSogpReportLeftBehindEntry,
  AdminSogpReportLeftBehindFlag,
  AdminSogpReportParticipant,
  AdminSogpReportWeek,
} from "@/lib/admin-query";

export const SOGP_INACTIVITY_WINDOW_DAYS = 7;
export const SOGP_LEFT_BEHIND_PACE_THRESHOLD = 0.5;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const ENROLLMENT_STATUSES = [
  "enrolled",
  "preparing",
  "active",
  "carryover",
  "completed",
  "withdrawn",
] as const;

const LEFT_BEHIND_ELIGIBLE_STATUSES = new Set<string>([
  "enrolled",
  "preparing",
  "active",
  "carryover",
]);

function toDateKey(value: Date | string) {
  return typeof value === "string" ? value.slice(0, 10) : value.toISOString().slice(0, 10);
}

/**
 * A track counts as completed once its quiz is passed and, when the lesson
 * requires a written response, that response has been approved — the same
 * rule already used for the learner dashboard (lib/db/queries/sogp.ts) and
 * level progression (lib/sogp/progression.ts). Kept in one place here so
 * the report can't silently drift from those.
 */
export function deriveTrackCompleted(
  lesson: { responsePrompt: string | null },
  progress: { quizPassed: boolean; writtenApproved: boolean } | undefined,
): boolean {
  return (
    Boolean(progress?.quizPassed) &&
    (!lesson.responsePrompt || Boolean(progress?.writtenApproved))
  );
}

/**
 * Per-week date ranges, derived from the actual scheduled release times
 * (sogpCohortTracks.releaseAt) rather than a fixed startsAt + 7*n formula —
 * releaseAt reflects what admins actually configured for the cohort, which
 * can drift from a pure calendar assumption if the curriculum push was
 * late or partial. Falls back to startsAt + 7*(week-1) for any week that
 * has no scheduled tracks yet (e.g. curriculum not configured).
 */
export function computeCohortWeekDateRanges(
  cohort: { startsAt: Date },
  tracksForCohort: Array<{ weekNumber: number; releaseAt: Date }>,
): Array<{ week: number; startsAt: Date; endsAt: Date }> {
  const ranges: Array<{ week: number; startsAt: Date; endsAt: Date }> = [];

  for (let week = 1; week <= SOGP_TOTAL_WEEKS; week += 1) {
    const weekTracks = tracksForCohort.filter((track) => track.weekNumber === week);

    if (weekTracks.length) {
      const startsAt = new Date(Math.min(...weekTracks.map((track) => track.releaseAt.getTime())));
      const nextWeekTracks = tracksForCohort.filter((track) => track.weekNumber === week + 1);
      const endsAt = nextWeekTracks.length
        ? new Date(Math.min(...nextWeekTracks.map((track) => track.releaseAt.getTime())))
        : new Date(startsAt.getTime() + 7 * MS_PER_DAY);
      ranges.push({ week, startsAt, endsAt });
    } else {
      const startsAt = new Date(cohort.startsAt.getTime() + (week - 1) * 7 * MS_PER_DAY);
      ranges.push({ week, startsAt, endsAt: new Date(startsAt.getTime() + 7 * MS_PER_DAY) });
    }
  }

  return ranges;
}

/**
 * "Last activity" can't use studentProgress.completedAt — that column is
 * never written anywhere in this codebase (verified against every
 * lesson-progress write path), so it's always null. The only genuinely
 * timestamped per-user signals are quiz attempts, written submissions,
 * live class attendance, and prayer watch attendance.
 */
export function buildLastActivityIndex(
  raw: Pick<
    SogpReportRawData,
    "quizAttempts" | "writtenSubmissions" | "liveClassAttendance" | "prayerWatchAttendance"
  >,
): Map<string, Date> {
  const index = new Map<string, Date>();
  const bump = (userId: string, time: number) => {
    const current = index.get(userId);
    if (!current || time > current.getTime()) index.set(userId, new Date(time));
  };

  for (const row of raw.quizAttempts) bump(row.userId, row.createdAt.getTime());
  for (const row of raw.writtenSubmissions) {
    bump(row.userId, (row.submittedAt ?? row.createdAt).getTime());
  }
  for (const row of raw.liveClassAttendance) bump(row.userId, row.attendedAt.getTime());
  for (const row of raw.prayerWatchAttendance) {
    bump(row.userId, new Date(`${row.attendedDate}T00:00:00.000Z`).getTime());
  }

  return index;
}

function groupBy<T, K>(rows: T[], key: (row: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const row of rows) {
    const k = key(row);
    const bucket = map.get(k);
    if (bucket) bucket.push(row);
    else map.set(k, [row]);
  }
  return map;
}

export function buildSogpReport(raw: SogpReportRawData, now = new Date()): AdminSogpReportData {
  const tracksByCohort = groupBy(raw.tracks, (row) => row.track.cohortId);
  const enrollmentsByCohort = groupBy(raw.enrollments, (row) => row.cohortId);
  const liveClassesByCohort = groupBy(raw.liveClasses, (row) => row.cohortId);
  const publishedPrepDaysByCohort = new Map<number, number>();
  for (const day of raw.preparationDays) {
    if (day.status !== "published") continue;
    publishedPrepDaysByCohort.set(day.cohortId, (publishedPrepDaysByCohort.get(day.cohortId) ?? 0) + 1);
  }

  const progressByUserLesson = new Map<string, { quizPassed: boolean; writtenApproved: boolean }>();
  for (const row of raw.progress) {
    progressByUserLesson.set(`${row.userId}:${row.lessonId}`, row);
  }

  const prepCompletionCountByEnrollment = new Map<number, number>();
  for (const row of raw.preparationCompletions) {
    prepCompletionCountByEnrollment.set(
      row.enrollmentId,
      (prepCompletionCountByEnrollment.get(row.enrollmentId) ?? 0) + 1,
    );
  }

  const liveClassAttendanceByUser = groupBy(raw.liveClassAttendance, (row) => row.userId);
  const prayerDatesByUser = groupBy(raw.prayerWatchAttendance, (row) => row.userId);

  const activeCertificateEnrollmentIds = new Set(
    raw.certificates.filter((certificate) => !certificate.revokedAt).map((certificate) => certificate.enrollmentId),
  );

  const lastActivityIndex = buildLastActivityIndex(raw);

  const participants: AdminSogpReportParticipant[] = [];

  const cohorts: AdminSogpReportCohort[] = raw.cohorts.map((cohort) => {
    const cohortTracks = tracksByCohort.get(cohort.id) ?? [];
    const requiredTracks = cohortTracks.filter((row) => row.track.isRequired);
    const cohortEnrollments = enrollmentsByCohort.get(cohort.id) ?? [];
    const cohortLiveClasses = liveClassesByCohort.get(cohort.id) ?? [];
    const requiredLiveClasses = cohortLiveClasses.filter((liveClass) => liveClass.isRequired);
    const weekRanges = computeCohortWeekDateRanges(
      cohort,
      cohortTracks.map((row) => ({ weekNumber: row.track.weekNumber, releaseAt: row.track.releaseAt })),
    );

    const statusBreakdown: Record<string, number> = Object.fromEntries(
      ENROLLMENT_STATUSES.map((status) => [status, 0]),
    );
    for (const enrollment of cohortEnrollments) {
      statusBreakdown[enrollment.status] = (statusBreakdown[enrollment.status] ?? 0) + 1;
    }

    const cohortStartKey = toDateKey(cohort.startsAt);
    const cohortEndKey = toDateKey(cohort.endsAt);
    const cohortDayCount = Math.max(
      1,
      Math.round((cohort.endsAt.getTime() - cohort.startsAt.getTime()) / MS_PER_DAY),
    );

    let completionPercentSum = 0;
    let prepCompleteCount = 0;
    let liveClassRateSum = 0;
    let prayerRateSum = 0;

    for (const enrollment of cohortEnrollments) {
      const completedRequired = requiredTracks.filter((row) =>
        deriveTrackCompleted(row.lesson, progressByUserLesson.get(`${enrollment.userId}:${row.lesson.id}`)),
      ).length;
      const completionPercent = requiredTracks.length ? (completedRequired / requiredTracks.length) * 100 : 0;
      completionPercentSum += completionPercent;

      const publishedPrepDays = publishedPrepDaysByCohort.get(cohort.id) ?? 0;
      const prepCompletions = prepCompletionCountByEnrollment.get(enrollment.id) ?? 0;
      if (publishedPrepDays > 0 && prepCompletions >= publishedPrepDays) prepCompleteCount += 1;

      const attendedRequiredLiveClasses = requiredLiveClasses.filter((liveClass) =>
        (liveClassAttendanceByUser.get(enrollment.userId) ?? []).some(
          (attendance) => attendance.liveClassId === liveClass.id,
        ),
      ).length;
      liveClassRateSum += requiredLiveClasses.length
        ? (attendedRequiredLiveClasses / requiredLiveClasses.length) * 100
        : 0;

      const prayerDaysAttended = (prayerDatesByUser.get(enrollment.userId) ?? []).filter(
        (row) => row.attendedDate >= cohortStartKey && row.attendedDate <= cohortEndKey,
      ).length;
      prayerRateSum += (prayerDaysAttended / cohortDayCount) * 100;

      participants.push({
        enrollmentId: enrollment.id,
        cohortId: cohort.id,
        cohortTitle: cohort.title,
        name: enrollment.name,
        email: enrollment.email,
        status: enrollment.status,
        weeklyTrackCompletion: weekRanges.map(({ week }) => {
          const weekRequiredTracks = requiredTracks.filter((row) => row.track.weekNumber === week);
          const completed = weekRequiredTracks.filter((row) =>
            deriveTrackCompleted(row.lesson, progressByUserLesson.get(`${enrollment.userId}:${row.lesson.id}`)),
          ).length;
          return { week, completed, total: weekRequiredTracks.length };
        }),
        liveClassesAttended: attendedRequiredLiveClasses,
        liveClassesRequired: requiredLiveClasses.length,
        prayerWatchDays: prayerDaysAttended,
        completionPercent,
      });
    }

    const enrollmentCount = cohortEnrollments.length;
    const weeklyParticipation: AdminSogpReportWeek[] = weekRanges.map(({ week, startsAt, endsAt }) => {
      const activeEnrollments = cohortEnrollments.filter(
        (enrollment) => enrollment.status !== "withdrawn" && enrollment.createdAt <= endsAt,
      );
      const weekRequiredTracks = requiredTracks.filter((row) => row.track.weekNumber === week);
      const weekLiveClasses = cohortLiveClasses.filter(
        (liveClass) => liveClass.startsAt >= startsAt && liveClass.startsAt < endsAt,
      );
      const weekDayCount = Math.max(1, Math.round((endsAt.getTime() - startsAt.getTime()) / MS_PER_DAY));
      const weekStartKey = toDateKey(startsAt);
      const weekEndKey = toDateKey(endsAt);

      let completedAtLeastOne = 0;
      let completedAll = 0;
      let liveClassAttendance = 0;
      let prayerWatchDistinctDays = 0;

      for (const enrollment of activeEnrollments) {
        const completedInWeek = weekRequiredTracks.filter((row) =>
          deriveTrackCompleted(row.lesson, progressByUserLesson.get(`${enrollment.userId}:${row.lesson.id}`)),
        ).length;
        if (completedInWeek > 0) completedAtLeastOne += 1;
        if (weekRequiredTracks.length && completedInWeek === weekRequiredTracks.length) completedAll += 1;

        const attendedThisWeek = weekLiveClasses.some((liveClass) =>
          (liveClassAttendanceByUser.get(enrollment.userId) ?? []).some(
            (attendance) => attendance.liveClassId === liveClass.id,
          ),
        );
        if (attendedThisWeek) liveClassAttendance += 1;

        const daysThisWeek = (prayerDatesByUser.get(enrollment.userId) ?? []).filter(
          (row) => row.attendedDate >= weekStartKey && row.attendedDate < weekEndKey,
        ).length;
        prayerWatchDistinctDays += Math.min(daysThisWeek, weekDayCount);
      }

      const activeCount = activeEnrollments.length;
      return {
        week,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        activeEnrollments: activeCount,
        completedAtLeastOneRequiredTrack: completedAtLeastOne,
        completedAllRequiredTracksForWeek: completedAll,
        trackCompletionPercent: activeCount ? (completedAll / activeCount) * 100 : 0,
        liveClassAttendance,
        liveClassAttendancePercent: activeCount ? (liveClassAttendance / activeCount) * 100 : 0,
        prayerWatchDistinctDays,
        prayerWatchParticipationPercent: activeCount
          ? (prayerWatchDistinctDays / (activeCount * weekDayCount)) * 100
          : 0,
      };
    });

    return {
      id: cohort.id,
      slug: cohort.slug,
      title: cohort.title,
      status: cohort.status,
      startsAt: cohort.startsAt.toISOString(),
      endsAt: cohort.endsAt.toISOString(),
      totalEnrollments: enrollmentCount,
      statusBreakdown,
      averageCompletionPercent: enrollmentCount ? completionPercentSum / enrollmentCount : 0,
      prepPhaseCompletionRate: enrollmentCount ? (prepCompleteCount / enrollmentCount) * 100 : 0,
      liveClassAttendanceRate: enrollmentCount ? liveClassRateSum / enrollmentCount : 0,
      prayerWatchParticipationRate: enrollmentCount ? prayerRateSum / enrollmentCount : 0,
      certificatesIssued: cohortEnrollments.filter((enrollment) => activeCertificateEnrollmentIds.has(enrollment.id))
        .length,
      weeklyParticipation,
    };
  });

  const leftBehind: AdminSogpReportLeftBehindEntry[] = [];

  for (const cohort of raw.cohorts) {
    const { phase, week } = getSogpCohortWeek(cohort.startsAt, cohort.endsAt, now);
    if (phase === "preparation") continue; // cohort hasn't started yet — no pace to be behind on

    const effectiveWeek = phase === "active" ? (week as number) : SOGP_TOTAL_WEEKS;
    const cohortTracks = tracksByCohort.get(cohort.id) ?? [];
    const requiredTracks = cohortTracks.filter(
      (row) => row.track.isRequired && row.track.weekNumber <= effectiveWeek,
    );
    const cohortEnrollments = (enrollmentsByCohort.get(cohort.id) ?? []).filter((enrollment) =>
      LEFT_BEHIND_ELIGIBLE_STATUSES.has(enrollment.status),
    );

    for (const enrollment of cohortEnrollments) {
      const completedTrackCount = requiredTracks.filter((row) =>
        deriveTrackCompleted(row.lesson, progressByUserLesson.get(`${enrollment.userId}:${row.lesson.id}`)),
      ).length;
      const expectedTrackCount = requiredTracks.length;
      const behindPace =
        expectedTrackCount > 0 && completedTrackCount < expectedTrackCount * SOGP_LEFT_BEHIND_PACE_THRESHOLD;

      const lastActivityAt = lastActivityIndex.get(enrollment.userId) ?? null;
      const daysSinceLastActivity = lastActivityAt
        ? Math.floor((now.getTime() - lastActivityAt.getTime()) / MS_PER_DAY)
        : null;
      const inactive = daysSinceLastActivity === null || daysSinceLastActivity >= SOGP_INACTIVITY_WINDOW_DAYS;

      const flags: AdminSogpReportLeftBehindFlag[] = [];
      if (behindPace) flags.push("behind_pace");
      if (inactive) flags.push("inactive_7_days");
      if (!flags.length) continue;

      leftBehind.push({
        enrollmentId: enrollment.id,
        cohortId: cohort.id,
        cohortTitle: cohort.title,
        name: enrollment.name,
        email: enrollment.email,
        currentWeek: phase === "active" ? (week as number) : null,
        expectedTrackCount,
        completedTrackCount,
        completionPercent: expectedTrackCount ? (completedTrackCount / expectedTrackCount) * 100 : 0,
        lastActivityAt: lastActivityAt ? lastActivityAt.toISOString() : null,
        daysSinceLastActivity,
        flags,
      });
    }
  }

  return {
    generatedAt: now.toISOString(),
    cohorts,
    participants,
    leftBehind,
  };
}
