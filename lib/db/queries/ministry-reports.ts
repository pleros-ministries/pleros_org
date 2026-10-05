import { and, asc, desc, eq, gte, inArray, lt, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  MINISTRY_FIELDS,
  NO_DAY_ACTIVITY,
  emptyMinistryNumbers,
  type DayActivity,
  type MinistryNumbers,
} from "@/lib/community/ministry-report";
import { getSogpDailyParticipation, getSogpParticipationRange } from "@/lib/db/queries/sogp-daily";
import {
  lagosDayRange,
  lagosRange,
  toLagosDateKey,
} from "@/lib/sogp/daily-participation";

/**
 * Daily ministry reports, plus the Pleros activity compiled beside them.
 * Activity is always read live from its own tables (Bible reading, Prayer
 * Watch, podcast, SOGP); only the report numbers and note are stored.
 */

const reports = schema.ministryReports;

const numberColumns = {
  reachedOnline: reports.reachedOnline,
  reachedOffline: reports.reachedOffline,
  saved: reports.saved,
  notSaved: reports.notSaved,
  filled: reports.filled,
  healed: reports.healed,
  followUps: reports.followUps,
};

function pickNumbers(row: MinistryNumbers): MinistryNumbers {
  const numbers = emptyMinistryNumbers();
  for (const field of MINISTRY_FIELDS) numbers[field.key] = row[field.key];
  return numbers;
}

// ─── A member's own reports ────────────────────────────────────────────────

export type MemberReport = MinistryNumbers & {
  reportDate: string;
  note: string | null;
};

/** One person's reports between two Lagos date keys (inclusive), newest first. */
export async function listReportsForUser(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<MemberReport[]> {
  return db
    .select({ reportDate: reports.reportDate, note: reports.note, ...numberColumns })
    .from(reports)
    .where(
      and(
        eq(reports.userId, userId),
        gte(reports.reportDate, fromKey),
        lte(reports.reportDate, toKey),
      ),
    )
    .orderBy(desc(reports.reportDate));
}

export async function hasReportFor(
  userId: string,
  dateKey: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.userId, userId), eq(reports.reportDate, dateKey)))
    .limit(1);
  return Boolean(row);
}

// ─── Pleros activity for one day ───────────────────────────────────────────

type ActivityMember = {
  userId: string;
  /** The enrolment whose SOGP activity counts; null when not in a cohort. */
  enrollmentId: number | null;
  cohortId: number | null;
};

/** Narrow each lookup to the people asked for when there are few of them. */
const NARROW_LIMIT = 50;

/**
 * Compiles what the app recorded for each member on `dateKey`. A fixed number
 * of queries however many members are passed (one extra per cohort for SOGP).
 */
async function loadDayActivity(
  members: ActivityMember[],
  dateKey: string,
): Promise<Map<string, DayActivity>> {
  const result = new Map<string, DayActivity>();
  if (members.length === 0) return result;

  const narrow = members.length <= NARROW_LIMIT;
  const userIds = members.map((member) => member.userId);
  const enrolled = members.filter(
    (member): member is ActivityMember & { enrollmentId: number; cohortId: number } =>
      member.enrollmentId != null && member.cohortId != null,
  );
  const enrollmentIds = enrolled.map((member) => member.enrollmentId);
  const cohortIds = [...new Set(enrolled.map((member) => member.cohortId))];
  const { start, end } = lagosDayRange(dateKey);

  const [bibleRows, prayerRows, podcastRows, prepRows, sogpRows] = await Promise.all([
    db
      .select({
        userId: schema.bibleReadingLogs.userId,
        chapters: schema.bibleReadingLogs.chaptersRead,
        book: schema.bibleReadingLogs.currentBook,
        chapter: schema.bibleReadingLogs.currentChapter,
      })
      .from(schema.bibleReadingLogs)
      .where(
        and(
          eq(schema.bibleReadingLogs.readingDate, dateKey),
          narrow ? inArray(schema.bibleReadingLogs.userId, userIds) : undefined,
        ),
      ),
    db
      .select({
        userId: schema.prayerWatchAttendance.userId,
        session: schema.prayerWatchAttendance.session,
      })
      .from(schema.prayerWatchAttendance)
      .where(
        and(
          eq(schema.prayerWatchAttendance.attendedDate, dateKey),
          narrow
            ? inArray(schema.prayerWatchAttendance.userId, userIds)
            : undefined,
        ),
      ),
    db
      .select({
        userId: schema.podcastEpisodeProgress.userId,
        episodes: sql<number>`count(*)::int`,
      })
      .from(schema.podcastEpisodeProgress)
      .where(
        and(
          gte(schema.podcastEpisodeProgress.listenedAt, start),
          lt(schema.podcastEpisodeProgress.listenedAt, end),
          narrow
            ? inArray(schema.podcastEpisodeProgress.userId, userIds)
            : undefined,
        ),
      )
      .groupBy(schema.podcastEpisodeProgress.userId),
    enrollmentIds.length > 0
      ? db
          .select({
            enrollmentId: schema.sogpPreparationCompletions.enrollmentId,
          })
          .from(schema.sogpPreparationCompletions)
          .where(
            and(
              gte(schema.sogpPreparationCompletions.completedAt, start),
              lt(schema.sogpPreparationCompletions.completedAt, end),
              narrow
                ? inArray(
                    schema.sogpPreparationCompletions.enrollmentId,
                    enrollmentIds,
                  )
                : undefined,
            ),
          )
      : Promise.resolve([]),
    Promise.all(
      cohortIds.map((cohortId) =>
        getSogpDailyParticipation(
          cohortId,
          dateKey,
          undefined,
          narrow
            ? enrolled
                .filter((member) => member.cohortId === cohortId)
                .map((member) => member.enrollmentId)
            : undefined,
        ),
      ),
    ),
  ]);

  const bibleByUser = new Map(bibleRows.map((row) => [row.userId, row]));
  const prayerByUser = new Map<string, DayActivity["prayerWatch"]>();
  for (const row of prayerRows) {
    prayerByUser.set(row.userId, [
      ...(prayerByUser.get(row.userId) ?? []),
      row.session,
    ]);
  }
  const podcastByUser = new Map(podcastRows.map((row) => [row.userId, row.episodes]));
  const prepDone = new Set(prepRows.map((row) => row.enrollmentId));
  const sogpByEnrollment = new Map(
    sogpRows.flat().map((row) => [row.enrollmentId, row]),
  );

  for (const member of members) {
    const bible = bibleByUser.get(member.userId);
    const sogp =
      member.enrollmentId != null
        ? sogpByEnrollment.get(member.enrollmentId)
        : undefined;
    result.set(member.userId, {
      bible: bible
        ? { chapters: bible.chapters, book: bible.book, chapter: bible.chapter }
        : null,
      prayerWatch: prayerByUser.get(member.userId) ?? [],
      podcastEpisodes: podcastByUser.get(member.userId) ?? 0,
      sogp:
        member.enrollmentId != null
          ? {
              listened: sogp?.listened ?? null,
              quizAttempted: sogp?.quizAttempted ?? false,
              writtenSubmitted: sogp?.writtenSubmitted ?? false,
              reviewAttended: sogp?.reviewAttended ?? false,
              preparationDone: prepDone.has(member.enrollmentId),
            }
          : null,
    });
  }
  return result;
}

/** The newest enrolment a person holds, which is the cohort they are working through. */
async function findActivityMember(userId: string): Promise<ActivityMember> {
  const [enrollment] = await db
    .select({
      enrollmentId: schema.sogpEnrollments.id,
      cohortId: schema.sogpEnrollments.cohortId,
    })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.userId, userId))
    .orderBy(desc(schema.sogpEnrollments.createdAt))
    .limit(1);
  return {
    userId,
    enrollmentId: enrollment?.enrollmentId ?? null,
    cohortId: enrollment?.cohortId ?? null,
  };
}

/** One member's Pleros activity on one day. */
export async function getDayActivity(
  userId: string,
  dateKey: string,
): Promise<DayActivity> {
  const member = await findActivityMember(userId);
  const activity = await loadDayActivity([member], dateKey);
  return activity.get(userId) ?? NO_DAY_ACTIVITY;
}

// ─── Activity across a run of days (history tables) ────────────────────────

/** A lighter view of a day, for tables that span many days. */
export type DayActivitySummary = {
  bible: boolean;
  prayerWatch: boolean;
  podcastEpisodes: number;
  /** null when the member is not in a cohort. */
  sogp: boolean | null;
};

/** One member's activity for each day between two Lagos date keys, keyed by date. */
export async function getActivityRange(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<Map<string, DayActivitySummary>> {
  const member = await findActivityMember(userId);
  const { start, end } = lagosRange(fromKey, toKey);

  const [bibleRows, prayerRows, podcastRows, sogpRows] = await Promise.all([
    db
      .select({ dateKey: schema.bibleReadingLogs.readingDate })
      .from(schema.bibleReadingLogs)
      .where(
        and(
          eq(schema.bibleReadingLogs.userId, userId),
          gte(schema.bibleReadingLogs.readingDate, fromKey),
          lte(schema.bibleReadingLogs.readingDate, toKey),
        ),
      ),
    db
      .select({ dateKey: schema.prayerWatchAttendance.attendedDate })
      .from(schema.prayerWatchAttendance)
      .where(
        and(
          eq(schema.prayerWatchAttendance.userId, userId),
          gte(schema.prayerWatchAttendance.attendedDate, fromKey),
          lte(schema.prayerWatchAttendance.attendedDate, toKey),
        ),
      ),
    db
      .select({ listenedAt: schema.podcastEpisodeProgress.listenedAt })
      .from(schema.podcastEpisodeProgress)
      .where(
        and(
          eq(schema.podcastEpisodeProgress.userId, userId),
          gte(schema.podcastEpisodeProgress.listenedAt, start),
          lt(schema.podcastEpisodeProgress.listenedAt, end),
        ),
      ),
    member.enrollmentId != null && member.cohortId != null
      ? getSogpParticipationRange(member.cohortId, fromKey, toKey, {
          enrollmentIds: [member.enrollmentId],
        })
      : Promise.resolve([]),
  ]);

  const days = new Map<string, DayActivitySummary>();
  const day = (dateKey: string) => {
    let entry = days.get(dateKey);
    if (!entry) {
      entry = {
        bible: false,
        prayerWatch: false,
        podcastEpisodes: 0,
        sogp: member.enrollmentId != null ? false : null,
      };
      days.set(dateKey, entry);
    }
    return entry;
  };

  for (const row of bibleRows) day(row.dateKey).bible = true;
  for (const row of prayerRows) day(row.dateKey).prayerWatch = true;
  for (const row of podcastRows) {
    day(toLagosDateKey(row.listenedAt)).podcastEpisodes += 1;
  }
  for (const row of sogpRows) {
    if (row.listened === true || row.reviewAttended === true) {
      day(row.dateKey).sogp = true;
    }
  }
  return days;
}

// ─── Staff views ───────────────────────────────────────────────────────────

export type StaffMinistryRow = {
  userId: string;
  name: string;
  unitName: string | null;
  report: (MinistryNumbers & { note: string | null }) | null;
  activity: DayActivity;
};

/**
 * Everyone's ministry day: each community member (optionally one location
 * group) with their report, if any, and their Pleros activity. Carries full
 * names, so it is for admins and the group's assigned pastor only.
 */
export async function getMinistryDay({
  dateKey,
  unitId,
}: {
  dateKey: string;
  unitId?: number | null;
}): Promise<StaffMinistryRow[]> {
  const [enrolmentRows, reportRows] = await Promise.all([
    db
      .select({
        userId: schema.sogpEnrollments.userId,
        name: schema.sogpEnrollments.name,
        enrollmentId: schema.sogpEnrollments.id,
        cohortId: schema.sogpEnrollments.cohortId,
        unitName: schema.units.name,
      })
      .from(schema.sogpEnrollments)
      .leftJoin(
        schema.unitMembers,
        eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
      )
      .leftJoin(schema.units, eq(schema.units.id, schema.unitMembers.unitId))
      .where(unitId != null ? eq(schema.unitMembers.unitId, unitId) : undefined)
      // Newest enrolment first, so it is the one kept for each person below.
      .orderBy(desc(schema.sogpEnrollments.createdAt)),
    db
      .select({
        userId: reports.userId,
        userName: schema.users.name,
        note: reports.note,
        ...numberColumns,
      })
      .from(reports)
      .innerJoin(schema.users, eq(schema.users.id, reports.userId))
      .where(eq(reports.reportDate, dateKey)),
  ]);

  type Member = ActivityMember & { name: string; unitName: string | null };
  const members = new Map<string, Member>();
  for (const row of enrolmentRows) {
    if (!members.has(row.userId)) members.set(row.userId, row);
  }
  // Admins and pastors may report without an enrolment; show them when no group is selected.
  if (unitId == null) {
    for (const row of reportRows) {
      if (!members.has(row.userId)) {
        members.set(row.userId, {
          userId: row.userId,
          name: row.userName,
          unitName: null,
          enrollmentId: null,
          cohortId: null,
        });
      }
    }
  }

  const memberList = [...members.values()];
  const activity = await loadDayActivity(memberList, dateKey);
  const reportByUser = new Map(reportRows.map((row) => [row.userId, row]));

  return memberList
    .map((member) => {
      const report = reportByUser.get(member.userId);
      return {
        userId: member.userId,
        name: member.name,
        unitName: member.unitName,
        report: report ? { ...pickNumbers(report), note: report.note } : null,
        activity: activity.get(member.userId) ?? NO_DAY_ACTIVITY,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type MinistryDayTotals = MinistryNumbers & {
  dateKey: string;
  reports: number;
};

/** Reports received and their totals for each day in a range, newest first. */
export async function getMinistryTotalsByDay(
  fromKey: string,
  toKey: string,
  { unitId }: { unitId?: number | null } = {},
): Promise<MinistryDayTotals[]> {
  const inUnit =
    unitId != null
      ? inArray(
          reports.userId,
          db
            .select({ userId: schema.sogpEnrollments.userId })
            .from(schema.sogpEnrollments)
            .innerJoin(
              schema.unitMembers,
              eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
            )
            .where(eq(schema.unitMembers.unitId, unitId)),
        )
      : undefined;

  return db
    .select({
      dateKey: reports.reportDate,
      reports: sql<number>`count(*)::int`,
      reachedOnline: sql<number>`coalesce(sum(${reports.reachedOnline}), 0)::int`,
      reachedOffline: sql<number>`coalesce(sum(${reports.reachedOffline}), 0)::int`,
      saved: sql<number>`coalesce(sum(${reports.saved}), 0)::int`,
      notSaved: sql<number>`coalesce(sum(${reports.notSaved}), 0)::int`,
      filled: sql<number>`coalesce(sum(${reports.filled}), 0)::int`,
      healed: sql<number>`coalesce(sum(${reports.healed}), 0)::int`,
      followUps: sql<number>`coalesce(sum(${reports.followUps}), 0)::int`,
    })
    .from(reports)
    .where(
      and(gte(reports.reportDate, fromKey), lte(reports.reportDate, toKey), inUnit),
    )
    .groupBy(reports.reportDate)
    .orderBy(desc(reports.reportDate));
}

export type MinistryMemberTotals = MinistryNumbers & {
  userId: string;
  name: string;
  unitName: string | null;
  /** Days in the range on which this member sent a report. */
  reports: number;
};

/** Each member's totals between two Lagos date keys — the sortable range table. */
export async function getMinistryTotalsByMember(
  fromKey: string,
  toKey: string,
  { unitId }: { unitId?: number | null } = {},
): Promise<MinistryMemberTotals[]> {
  const inUnit =
    unitId != null
      ? inArray(
          reports.userId,
          db
            .select({ userId: schema.sogpEnrollments.userId })
            .from(schema.sogpEnrollments)
            .innerJoin(
              schema.unitMembers,
              eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
            )
            .where(eq(schema.unitMembers.unitId, unitId)),
        )
      : undefined;

  return db
    .select({
      userId: reports.userId,
      name: schema.users.name,
      // The member's location group, from their first enrolment.
      unitName: sql<string | null>`(
        select ${schema.units.name} from ${schema.sogpEnrollments}
        inner join ${schema.unitMembers}
          on ${schema.unitMembers.enrollmentId} = ${schema.sogpEnrollments.id}
        inner join ${schema.units}
          on ${schema.units.id} = ${schema.unitMembers.unitId}
        where ${schema.sogpEnrollments.userId} = ${reports.userId}
        order by ${schema.sogpEnrollments.createdAt}
        limit 1
      )`,
      reports: sql<number>`count(*)::int`,
      reachedOnline: sql<number>`coalesce(sum(${reports.reachedOnline}), 0)::int`,
      reachedOffline: sql<number>`coalesce(sum(${reports.reachedOffline}), 0)::int`,
      saved: sql<number>`coalesce(sum(${reports.saved}), 0)::int`,
      notSaved: sql<number>`coalesce(sum(${reports.notSaved}), 0)::int`,
      filled: sql<number>`coalesce(sum(${reports.filled}), 0)::int`,
      healed: sql<number>`coalesce(sum(${reports.healed}), 0)::int`,
      followUps: sql<number>`coalesce(sum(${reports.followUps}), 0)::int`,
    })
    .from(reports)
    .innerJoin(schema.users, eq(schema.users.id, reports.userId))
    .where(
      and(gte(reports.reportDate, fromKey), lte(reports.reportDate, toKey), inUnit),
    )
    .groupBy(reports.userId, schema.users.name);
}

export type MemberMinistryHistory = {
  name: string;
  unitName: string | null;
  reports: MemberReport[];
  activity: Map<string, DayActivitySummary>;
};

/** One person's reports and activity over a range — the admin drill-down. */
export async function getMemberMinistryHistory(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<MemberMinistryHistory | null> {
  const [[person], [group], memberReports, activity] = await Promise.all([
    db
      .select({ name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1),
    db
      .select({ unitName: schema.units.name })
      .from(schema.sogpEnrollments)
      .innerJoin(
        schema.unitMembers,
        eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
      )
      .innerJoin(schema.units, eq(schema.units.id, schema.unitMembers.unitId))
      .where(eq(schema.sogpEnrollments.userId, userId))
      .orderBy(asc(schema.sogpEnrollments.createdAt))
      .limit(1),
    listReportsForUser(userId, fromKey, toKey),
    getActivityRange(userId, fromKey, toKey),
  ]);
  if (!person) return null;

  return {
    name: person.name,
    unitName: group?.unitName ?? null,
    reports: memberReports,
    activity,
  };
}

// ─── A discipler's view of their disciples ─────────────────────────────────

/** Numbers only: a discipler never receives a disciple's note. */
export type DiscipleMinistryDay = {
  membershipId: number;
  reachedOnline: number;
  reachedOffline: number;
  saved: number;
};

/**
 * The reports the leader's active disciples sent for `dateKey`. Scoped by the
 * leader's own enrolment, so a learner can only ever read their own group.
 * Disciples who sent nothing that day are simply absent.
 */
export async function getDisciplesMinistryDay(
  leaderEnrollmentId: number,
  dateKey: string,
): Promise<DiscipleMinistryDay[]> {
  return db
    .select({
      membershipId: schema.discipleshipMemberships.id,
      reachedOnline: reports.reachedOnline,
      reachedOffline: reports.reachedOffline,
      saved: reports.saved,
    })
    .from(schema.discipleshipGroups)
    .innerJoin(
      schema.discipleshipMemberships,
      and(
        eq(schema.discipleshipMemberships.groupId, schema.discipleshipGroups.id),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    )
    .innerJoin(
      schema.sogpEnrollments,
      eq(
        schema.sogpEnrollments.id,
        schema.discipleshipMemberships.discipleEnrollmentId,
      ),
    )
    .innerJoin(
      reports,
      and(
        eq(reports.userId, schema.sogpEnrollments.userId),
        eq(reports.reportDate, dateKey),
      ),
    )
    .where(eq(schema.discipleshipGroups.leaderEnrollmentId, leaderEnrollmentId));
}
