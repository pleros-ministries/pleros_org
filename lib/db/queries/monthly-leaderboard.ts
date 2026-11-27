import "server-only";

import { eq, inArray, sql } from "drizzle-orm";
import { cache } from "react";

import { firstNameOf } from "@/lib/community/visibility";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import {
  buildMonthlyLeaderboard,
  EMPTY_MONTHLY_COUNTS,
  LATE_RECORD_DAYS,
  monthWindow,
  PRAYER_SESSIONS_PER_DAY,
  type MonthlyCounts,
  type MonthlyLeaderboardData,
  type MonthlyPerson,
} from "@/lib/leaderboard/monthly";
import { OVERSIGHT_MAX_DEPTH } from "@/lib/oversight/tree";
import { lagosRange, toLagosDateKey } from "@/lib/sogp/daily-participation";

type CountRow = { user_id: string; n: number | string };

const lagosDay = (column: string) => sql.raw(`(${column} at time zone 'Africa/Lagos')::date`);
const LATE = sql.raw(String(LATE_RECORD_DAYS));

/**
 * Everyone's counts for the month so far, by person: four grouped reads that
 * run together. Learning is a Lagos day with anything learnt (a podcast or
 * Library episode, a lesson's teaching, quiz or written answer, or a Pre-SOGP
 * day); Prayer Watch is each session prayed, three at most a day; Bible
 * reading is a day with chapters read. Prayer Watch and Bible reading count
 * when recorded within `LATE_RECORD_DAYS` of the day, as reports allow.
 * Invitations are people who joined one of your groups or a group under you
 * (not the follow-up group the branch fills), or who enrolled with your link;
 * each person counts once for each person credited.
 */
async function readMonthCounts(startKey: string, todayKey: string) {
  const range = lagosRange(startKey, todayKey);
  const start = sql`${range.start.toISOString()}::timestamptz`;
  const end = sql`${range.end.toISOString()}::timestamptz`;
  const from = sql`${startKey}::date`;
  const to = sql`${todayKey}::date`;

  const [learning, prayer, bible, invitations] = await Promise.all([
    db.execute<CountRow>(sql`
      select user_id, count(*) as n from (
        select user_id, ${lagosDay("listened_at")} as day from podcast_episode_progress
          where listened_at >= ${start} and listened_at < ${end}
        union
        select user_id, ${lagosDay("audio_listened_at")} from student_progress
          where audio_listened and audio_listened_at >= ${start} and audio_listened_at < ${end}
        union
        select user_id, ${lagosDay("created_at")} from quiz_attempts
          where created_at >= ${start} and created_at < ${end}
        union
        select user_id, ${lagosDay("submitted_at")} from written_submissions
          where submitted_at >= ${start} and submitted_at < ${end}
        union
        select e.user_id, ${lagosDay("c.completed_at")} from sogp_preparation_completions c
          join sogp_enrollments e on e.id = c.enrollment_id
          where c.completed_at >= ${start} and c.completed_at < ${end}
      ) days
      group by user_id`),
    db.execute<CountRow>(sql`
      select user_id, sum(sessions) as n from (
        select user_id, least(count(distinct session), ${sql.raw(String(PRAYER_SESSIONS_PER_DAY))}) as sessions
        from prayer_watch_attendance
        where attended_date >= ${from} and attended_date <= ${to}
          and ${lagosDay("created_at")} <= attended_date + ${LATE}
        group by user_id, attended_date
      ) days
      group by user_id`),
    db.execute<CountRow>(sql`
      select user_id, count(distinct reading_date) as n from bible_reading_logs
      where chapters_read > 0 and reading_date >= ${from} and reading_date <= ${to}
        and ${lagosDay("created_at")} <= reading_date + ${LATE}
      group by user_id`),
    db.execute<CountRow>(sql`
      with recursive joins(joiner, leader, depth, path) as (
        select m.member_user_id, g.leader_user_id, 1, array[m.member_user_id, g.leader_user_id]
        from discipleship_memberships m
        join discipleship_groups g on g.id = m.group_id
        where m.status = 'active' and g.status <> 'closed' and not g.is_default
          and m.joined_at >= ${start} and m.joined_at < ${end}
          and m.member_user_id <> g.leader_user_id
        union all
        select j.joiner, g.leader_user_id, j.depth + 1, j.path || g.leader_user_id
        from joins j
        join discipleship_memberships m on m.member_user_id = j.leader and m.status = 'active'
        join discipleship_groups g on g.id = m.group_id and g.status <> 'closed'
        where j.depth < ${sql.raw(String(OVERSIGHT_MAX_DEPTH))} and not g.leader_user_id = any(j.path)
      ),
      credited(joiner, leader) as (
        select joiner, leader from joins
        union
        select e.user_id, r.user_id
        from sogp_enrollments e
        join sogp_enrollments r on r.id = e.referred_by_enrollment_id
        where e.status <> 'withdrawn' and e.created_at >= ${start} and e.created_at < ${end}
          and e.user_id <> r.user_id
      )
      select leader as user_id, count(distinct joiner) as n from credited group by leader`),
  ]);

  const counts = new Map<string, MonthlyCounts>();
  const add = (rows: CountRow[], field: keyof MonthlyCounts) => {
    for (const row of rows) {
      const current = counts.get(row.user_id) ?? { ...EMPTY_MONTHLY_COUNTS };
      current[field] = Number(row.n);
      counts.set(row.user_id, current);
    }
  };
  add(learning.rows, "learningDays");
  add(prayer.rows, "prayerSessions");
  add(bible.rows, "bibleDays");
  add(invitations.rows, "invitations");
  return counts;
}

/**
 * This month's leaderboard as one person sees it (Pastor, 25 November 2026):
 * everyone, whatever their path, for the calendar month in Lagos, starting
 * afresh on the 1st. Read-only; one read per request.
 */
export const getMonthlyLeaderboard = cache(async (viewerId: string, now: Date = new Date()): Promise<MonthlyLeaderboardData> => {
  const month = monthWindow(toLagosDateKey(now));
  const counts = await readMonthCounts(month.startKey, month.todayKey);
  const ids = [...new Set([...counts.keys(), viewerId])];

  const people = await db
    .select({ id: s.users.id, name: s.users.name, alias: s.leaderboardProfiles.alias, hidden: s.leaderboardProfiles.hidden })
    .from(s.users)
    .leftJoin(s.leaderboardProfiles, eq(s.leaderboardProfiles.userId, s.users.id))
    .where(inArray(s.users.id, ids));

  const viewer = people.find(row => row.id === viewerId);
  return buildMonthlyLeaderboard({
    month,
    viewerId,
    viewer: { firstName: firstNameOf(viewer?.name ?? ""), alias: viewer?.alias ?? null, hidden: viewer?.hidden ?? false },
    people: people.flatMap((row): MonthlyPerson[] => {
      const own = counts.get(row.id);
      return own ? [{ userId: row.id, firstName: firstNameOf(row.name), alias: row.alias, hidden: row.hidden ?? false, counts: own }] : [];
    }),
  });
});
