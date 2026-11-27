import "server-only";

import { and, eq, gt, gte, isNotNull, lt, lte, type AnyColumn } from "drizzle-orm";

import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { lagosRange, toLagosDateKey } from "@/lib/sogp/daily-participation";

/** Raw rows for one person's month so far; titles are attached by the caller. */
export type MonthActivityRows = {
  /** Podcast episodes and Library teachings (`teaching:<id>`), by the day they were marked listened. */
  episodes: Array<{ dateKey: string; guid: string }>;
  /** SOGP lessons listened to, quizzed on or written about, once per lesson a day. */
  lessons: Array<{ dateKey: string; lessonId: number; title: string }>;
  /** Pre-SOGP days completed. */
  preparation: Array<{ dateKey: string; label: string }>;
  /** Prayer Watch sessions a day, and the days with the 5:30 am one. */
  prayer: Record<string, number>;
  morningPrayer: string[];
  /** Days with Bible reading recorded. */
  bible: string[];
};

/**
 * What one person did each Lagos day from `startKey` through `todayKey` (the
 * monthly calendar, Pastor, 25 November 2026). Read-only; the five reads run
 * together.
 */
export async function getMonthActivityRows(userId: string, startKey: string, todayKey: string): Promise<MonthActivityRows> {
  const { start, end } = lagosRange(startKey, todayKey);
  const within = (column: AnyColumn) => and(gte(column, start), lt(column, end));

  const [episodes, listened, quizzes, written, preparation, prayer, bible] = await Promise.all([
    db.select({ guid: s.podcastEpisodeProgress.episodeGuid, at: s.podcastEpisodeProgress.listenedAt })
      .from(s.podcastEpisodeProgress)
      .where(and(eq(s.podcastEpisodeProgress.userId, userId), within(s.podcastEpisodeProgress.listenedAt)))
      .orderBy(s.podcastEpisodeProgress.listenedAt),
    db.select({ lessonId: s.studentProgress.lessonId, title: s.lessons.title, at: s.studentProgress.audioListenedAt })
      .from(s.studentProgress)
      .innerJoin(s.lessons, eq(s.lessons.id, s.studentProgress.lessonId))
      .where(and(eq(s.studentProgress.userId, userId), eq(s.studentProgress.audioListened, true), isNotNull(s.studentProgress.audioListenedAt), within(s.studentProgress.audioListenedAt))),
    db.select({ lessonId: s.quizAttempts.lessonId, title: s.lessons.title, at: s.quizAttempts.createdAt })
      .from(s.quizAttempts)
      .innerJoin(s.lessons, eq(s.lessons.id, s.quizAttempts.lessonId))
      .where(and(eq(s.quizAttempts.userId, userId), within(s.quizAttempts.createdAt))),
    db.select({ lessonId: s.writtenSubmissions.lessonId, title: s.lessons.title, at: s.writtenSubmissions.submittedAt })
      .from(s.writtenSubmissions)
      .innerJoin(s.lessons, eq(s.lessons.id, s.writtenSubmissions.lessonId))
      .where(and(eq(s.writtenSubmissions.userId, userId), isNotNull(s.writtenSubmissions.submittedAt), within(s.writtenSubmissions.submittedAt))),
    db.select({ label: s.sogpPreparationDays.countdownLabel, at: s.sogpPreparationCompletions.completedAt })
      .from(s.sogpPreparationCompletions)
      .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.sogpPreparationCompletions.enrollmentId))
      .innerJoin(s.sogpPreparationDays, eq(s.sogpPreparationDays.id, s.sogpPreparationCompletions.preparationDayId))
      .where(and(eq(s.sogpEnrollments.userId, userId), within(s.sogpPreparationCompletions.completedAt))),
    db.select({ date: s.prayerWatchAttendance.attendedDate, session: s.prayerWatchAttendance.session })
      .from(s.prayerWatchAttendance)
      .where(and(eq(s.prayerWatchAttendance.userId, userId), gte(s.prayerWatchAttendance.attendedDate, startKey), lte(s.prayerWatchAttendance.attendedDate, todayKey))),
    db.selectDistinct({ date: s.bibleReadingLogs.readingDate })
      .from(s.bibleReadingLogs)
      .where(and(eq(s.bibleReadingLogs.userId, userId), gt(s.bibleReadingLogs.chaptersRead, 0), gte(s.bibleReadingLogs.readingDate, startKey), lte(s.bibleReadingLogs.readingDate, todayKey))),
  ]);

  // A lesson listened to, quizzed on and written about on one day is one thing learnt that day.
  const lessons = new Map<string, MonthActivityRows["lessons"][number]>();
  for (const row of [...listened, ...quizzes, ...written].sort((a, b) => a.at!.getTime() - b.at!.getTime())) {
    const dateKey = toLagosDateKey(row.at!);
    lessons.set(`${dateKey}:${row.lessonId}`, lessons.get(`${dateKey}:${row.lessonId}`) ?? { dateKey, lessonId: row.lessonId, title: row.title });
  }

  // "Another time" and the named sessions each count once; three at most a day.
  const sessions = new Map<string, Set<string>>();
  for (const row of prayer) sessions.set(row.date, (sessions.get(row.date) ?? new Set()).add(row.session));

  return {
    episodes: episodes.filter(row => row.at).map(row => ({ dateKey: toLagosDateKey(row.at!), guid: row.guid })),
    lessons: [...lessons.values()],
    preparation: preparation.filter(row => row.at).map(row => ({ dateKey: toLagosDateKey(row.at!), label: row.label })),
    prayer: Object.fromEntries([...sessions].map(([date, set]) => [date, Math.min(3, set.size)])),
    morningPrayer: prayer.filter(row => row.session === "morning").map(row => row.date),
    bible: bible.map(row => row.date),
  };
}
