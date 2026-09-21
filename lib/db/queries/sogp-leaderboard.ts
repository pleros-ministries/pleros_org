import {
  and,
  count,
  eq,
  gte,
  inArray,
  lte,
  ne,
  sql,
  type AnyColumn,
} from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";
import {
  computeStreaks,
  denseRankFor,
  EMPTY_ACTIVITY_COUNTS,
  LEADERBOARD_MAX_LISTED,
  rankByPoints,
  scoreParticipant,
  type LeaderboardActivityCounts,
  type LeaderboardBreakdown,
} from "@/lib/sogp/leaderboard-scoring";

import { getSogpEnrollmentByUserId } from "./sogp";

export type LeaderboardEntry = {
  rank: number;
  name: string;
  points: number;
  currentStreak: number;
  isMe: boolean;
};

export type LeaderboardMe = {
  rank: number;
  points: number;
  currentStreak: number;
  longestStreak: number;
  hidden: boolean;
  breakdown: LeaderboardBreakdown;
};

export type LeaderboardData = {
  cohortTitle: string;
  top: LeaderboardEntry[];
  total: number;
  me: LeaderboardMe | null;
};

const lagosDay = (column: AnyColumn) =>
  sql<string>`to_char(${column} at time zone 'Africa/Lagos', 'YYYY-MM-DD')`;

function bump(
  map: Map<string, LeaderboardActivityCounts>,
  key: string,
  field: keyof LeaderboardActivityCounts,
  amount: number,
) {
  const current = map.get(key) ?? { ...EMPTY_ACTIVITY_COUNTS };
  current[field] += amount;
  map.set(key, current);
}

function addDay(map: Map<string, Set<string>>, key: string, day: string) {
  const days = map.get(key) ?? new Set<string>();
  days.add(day);
  map.set(key, days);
}

export async function getSogpLeaderboard(
  userId: string,
): Promise<LeaderboardData | null> {
  const enrollment = await getSogpEnrollmentByUserId(userId);
  if (!enrollment) return null;

  const [cohort] = await db
    .select()
    .from(schema.sogpCohorts)
    .where(eq(schema.sogpCohorts.id, enrollment.cohortId))
    .limit(1);
  if (!cohort) return null;

  const members = await db
    .select({
      id: schema.sogpEnrollments.id,
      userId: schema.sogpEnrollments.userId,
      name: schema.sogpEnrollments.name,
      optOut: schema.sogpEnrollments.leaderboardOptOut,
    })
    .from(schema.sogpEnrollments)
    .where(
      and(
        eq(schema.sogpEnrollments.cohortId, cohort.id),
        ne(schema.sogpEnrollments.status, "withdrawn"),
      ),
    );

  const meIsMember = members.some((member) => member.userId === userId);
  const memberUserIds = members.map((member) => member.userId);
  const memberEnrollmentIds = members.map((member) => member.id);
  const userIdByEnrollment = new Map(
    members.map((member) => [member.id, member.userId]),
  );

  const counts = new Map<string, LeaderboardActivityCounts>();
  const activityDays = new Map<string, Set<string>>();

  if (memberUserIds.length > 0) {
    const windowStart = toLagosDateKey(cohort.preparationStartsAt ?? cohort.startsAt);
    const windowEnd = toLagosDateKey(cohort.endsAt);

    const cohortLessons = db
      .select({ lessonId: schema.sogpCohortTracks.lessonId })
      .from(schema.sogpCohortTracks)
      .where(eq(schema.sogpCohortTracks.cohortId, cohort.id));

    const [
      progressRows,
      progressDays,
      quizDays,
      prayerCounts,
      prayerDays,
      reviewCounts,
      reviewDays,
      preparationCounts,
      preparationDays,
      shareCounts,
      shareDays,
      referralCounts,
    ] = await Promise.all([
      db
        .select({
          userId: schema.studentProgress.userId,
          quizPassed: sql<number>`count(*) filter (where ${schema.studentProgress.quizPassed})`.mapWith(Number),
          writtenApproved: sql<number>`count(*) filter (where ${schema.studentProgress.writtenApproved})`.mapWith(Number),
          daysCompleted: count(schema.studentProgress.completedAt),
        })
        .from(schema.studentProgress)
        .where(
          and(
            inArray(schema.studentProgress.userId, memberUserIds),
            inArray(schema.studentProgress.lessonId, cohortLessons),
          ),
        )
        .groupBy(schema.studentProgress.userId),
      db
        .selectDistinct({
          userId: schema.studentProgress.userId,
          day: lagosDay(schema.studentProgress.completedAt),
        })
        .from(schema.studentProgress)
        .where(
          and(
            inArray(schema.studentProgress.userId, memberUserIds),
            inArray(schema.studentProgress.lessonId, cohortLessons),
            sql`${schema.studentProgress.completedAt} is not null`,
          ),
        ),
      db
        .selectDistinct({
          userId: schema.quizAttempts.userId,
          day: lagosDay(schema.quizAttempts.createdAt),
        })
        .from(schema.quizAttempts)
        .where(
          and(
            inArray(schema.quizAttempts.userId, memberUserIds),
            inArray(schema.quizAttempts.lessonId, cohortLessons),
          ),
        ),
      db
        .select({
          userId: schema.prayerWatchAttendance.userId,
          total: count(),
        })
        .from(schema.prayerWatchAttendance)
        .where(
          and(
            inArray(schema.prayerWatchAttendance.userId, memberUserIds),
            gte(schema.prayerWatchAttendance.attendedDate, windowStart),
            lte(schema.prayerWatchAttendance.attendedDate, windowEnd),
          ),
        )
        .groupBy(schema.prayerWatchAttendance.userId),
      db
        .selectDistinct({
          userId: schema.prayerWatchAttendance.userId,
          day: schema.prayerWatchAttendance.attendedDate,
        })
        .from(schema.prayerWatchAttendance)
        .where(
          and(
            inArray(schema.prayerWatchAttendance.userId, memberUserIds),
            gte(schema.prayerWatchAttendance.attendedDate, windowStart),
            lte(schema.prayerWatchAttendance.attendedDate, windowEnd),
          ),
        ),
      db
        .select({
          userId: schema.sogpLiveClassAttendance.userId,
          total: count(),
        })
        .from(schema.sogpLiveClassAttendance)
        .innerJoin(
          schema.sogpLiveClasses,
          eq(schema.sogpLiveClassAttendance.liveClassId, schema.sogpLiveClasses.id),
        )
        .where(
          and(
            eq(schema.sogpLiveClasses.cohortId, cohort.id),
            inArray(schema.sogpLiveClassAttendance.userId, memberUserIds),
          ),
        )
        .groupBy(schema.sogpLiveClassAttendance.userId),
      db
        .selectDistinct({
          userId: schema.sogpLiveClassAttendance.userId,
          day: lagosDay(schema.sogpLiveClassAttendance.attendedAt),
        })
        .from(schema.sogpLiveClassAttendance)
        .innerJoin(
          schema.sogpLiveClasses,
          eq(schema.sogpLiveClassAttendance.liveClassId, schema.sogpLiveClasses.id),
        )
        .where(
          and(
            eq(schema.sogpLiveClasses.cohortId, cohort.id),
            inArray(schema.sogpLiveClassAttendance.userId, memberUserIds),
          ),
        ),
      db
        .select({
          enrollmentId: schema.sogpPreparationCompletions.enrollmentId,
          total: count(),
        })
        .from(schema.sogpPreparationCompletions)
        .where(
          inArray(schema.sogpPreparationCompletions.enrollmentId, memberEnrollmentIds),
        )
        .groupBy(schema.sogpPreparationCompletions.enrollmentId),
      db
        .selectDistinct({
          enrollmentId: schema.sogpPreparationCompletions.enrollmentId,
          day: lagosDay(schema.sogpPreparationCompletions.completedAt),
        })
        .from(schema.sogpPreparationCompletions)
        .where(
          inArray(schema.sogpPreparationCompletions.enrollmentId, memberEnrollmentIds),
        ),
      db
        .select({
          enrollmentId: schema.sogpLearningProgressShares.enrollmentId,
          total: count(),
        })
        .from(schema.sogpLearningProgressShares)
        .where(
          inArray(schema.sogpLearningProgressShares.enrollmentId, memberEnrollmentIds),
        )
        .groupBy(schema.sogpLearningProgressShares.enrollmentId),
      db
        .selectDistinct({
          enrollmentId: schema.sogpLearningProgressShares.enrollmentId,
          day: lagosDay(schema.sogpLearningProgressShares.createdAt),
        })
        .from(schema.sogpLearningProgressShares)
        .where(
          inArray(schema.sogpLearningProgressShares.enrollmentId, memberEnrollmentIds),
        ),
      db
        .select({
          referrerId: schema.sogpEnrollments.referredByEnrollmentId,
          total: count(),
        })
        .from(schema.sogpEnrollments)
        .where(
          and(
            inArray(schema.sogpEnrollments.referredByEnrollmentId, memberEnrollmentIds),
            ne(schema.sogpEnrollments.status, "withdrawn"),
          ),
        )
        .groupBy(schema.sogpEnrollments.referredByEnrollmentId),
    ]);

    for (const row of progressRows) {
      bump(counts, row.userId, "quizPassed", row.quizPassed);
      bump(counts, row.userId, "writtenApproved", row.writtenApproved);
      bump(counts, row.userId, "daysCompleted", row.daysCompleted);
    }
    for (const row of prayerCounts) bump(counts, row.userId, "prayerWatch", row.total);
    for (const row of reviewCounts) bump(counts, row.userId, "reviews", row.total);
    for (const row of preparationCounts) {
      const owner = userIdByEnrollment.get(row.enrollmentId);
      if (owner) bump(counts, owner, "preparationDays", row.total);
    }
    for (const row of shareCounts) {
      const owner = userIdByEnrollment.get(row.enrollmentId);
      if (owner) bump(counts, owner, "shares", row.total);
    }
    for (const row of referralCounts) {
      const owner =
        row.referrerId === null ? undefined : userIdByEnrollment.get(row.referrerId);
      if (owner) bump(counts, owner, "referrals", row.total);
    }

    for (const row of [...progressDays, ...quizDays, ...prayerDays, ...reviewDays]) {
      if (row.day) addDay(activityDays, row.userId, row.day);
    }
    for (const row of [...preparationDays, ...shareDays]) {
      const owner = userIdByEnrollment.get(row.enrollmentId);
      if (owner && row.day) addDay(activityDays, owner, row.day);
    }
  }

  const todayKey = toLagosDateKey(new Date());
  const scored = members.map((member) => {
    const streaks = computeStreaks(activityDays.get(member.userId) ?? [], todayKey);
    const breakdown = scoreParticipant(
      counts.get(member.userId) ?? EMPTY_ACTIVITY_COUNTS,
      streaks.longest,
    );
    return {
      userId: member.userId,
      name: member.name,
      hidden: member.optOut,
      points: breakdown.total,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      breakdown,
    };
  });

  const visible = scored.filter((row) => !row.hidden);
  const ranked = rankByPoints(visible);

  const mine = scored.find((row) => row.userId === userId);
  const myRank = mine
    ? (ranked.find((row) => row.userId === userId)?.rank ??
      denseRankFor(
        mine.points,
        visible.map((row) => row.points),
      ))
    : null;

  return {
    cohortTitle: cohort.title,
    top: ranked.slice(0, LEADERBOARD_MAX_LISTED).map((row) => ({
      rank: row.rank,
      name: row.name,
      points: row.points,
      currentStreak: row.currentStreak,
      isMe: row.userId === userId,
    })),
    total: visible.length,
    me:
      mine && meIsMember && myRank !== null
        ? {
            rank: myRank,
            points: mine.points,
            currentStreak: mine.currentStreak,
            longestStreak: mine.longestStreak,
            hidden: mine.hidden,
            breakdown: mine.breakdown,
          }
        : null,
  };
}

export async function setSogpLeaderboardVisibility(
  userId: string,
  hidden: boolean,
) {
  const enrollment = await getSogpEnrollmentByUserId(userId);
  if (!enrollment) return null;

  await db
    .update(schema.sogpEnrollments)
    .set({ leaderboardOptOut: hidden, updatedAt: new Date() })
    .where(eq(schema.sogpEnrollments.id, enrollment.id));

  return { hidden };
}
