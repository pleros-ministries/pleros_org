import "server-only";

import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";

import { getSogpDashboardData } from "./sogp";

export type HistoryTrack = {
  kind: "track";
  key: string;
  number: number;
  title: string;
  week: number;
  completed: boolean;
  /** Best quiz score, when they've taken the quiz. */
  quizScore: number | null;
  written: "submitted" | "approved" | "needs_revision" | null;
  lessonDone: boolean;
  at: string | null;
  href: string;
};
export type HistoryReview = { kind: "review"; key: string; title: string; status: "attended" | "missed"; at: string; week: number | null };
export type LearningHistory = {
  tracksDone: number;
  quizAverage: number | null;
  responses: number;
  weeks: Array<{ week: number; items: Array<HistoryTrack | HistoryReview> }>;
};

/** The signed-in learner's own history: every track they've started, its quiz and response, and their group reviews. */
export async function getOwnLearningHistory(userId: string): Promise<LearningHistory | null> {
  const course = await getSogpDashboardData(userId);
  if (!course) return null;
  const lessonIds = course.tracks.map(track => track.lesson.id);
  const [quizzes, written, reviews] = await Promise.all([
    lessonIds.length ? db.select({ lessonId: s.quizAttempts.lessonId, best: sql<number>`max(${s.quizAttempts.score})::int`, at: sql<Date>`max(${s.quizAttempts.createdAt})` })
      .from(s.quizAttempts)
      .where(and(eq(s.quizAttempts.userId, userId), inArray(s.quizAttempts.lessonId, lessonIds)))
      .groupBy(s.quizAttempts.lessonId) : [],
    lessonIds.length ? db.select({ lessonId: s.writtenSubmissions.lessonId, status: s.writtenSubmissions.status, at: s.writtenSubmissions.submittedAt })
      .from(s.writtenSubmissions)
      .where(and(eq(s.writtenSubmissions.userId, userId), inArray(s.writtenSubmissions.lessonId, lessonIds), ne(s.writtenSubmissions.status, "draft"))) : [],
    db.select({ id: s.sogpGroupReviews.id, title: s.sogpGroupReviews.title, startsAt: s.sogpGroupReviews.startsAt, status: s.sogpGroupReviewAttendance.status })
      .from(s.sogpGroupReviewAttendance)
      .innerJoin(s.sogpGroupReviews, eq(s.sogpGroupReviews.id, s.sogpGroupReviewAttendance.reviewId))
      .where(eq(s.sogpGroupReviewAttendance.enrollmentId, course.enrollment.id))
      .orderBy(desc(s.sogpGroupReviews.startsAt))
      .limit(60),
  ]);
  const quizBy = new Map(quizzes.map(row => [row.lessonId, row]));
  const writtenBy = new Map(written.map(row => [row.lessonId, row]));

  const started = course.tracks.filter(track => track.dayNumber != null && (track.completed || quizBy.has(track.lesson.id) || writtenBy.has(track.lesson.id) || track.progress.audioListened || track.progress.notesRead));
  const tracks: HistoryTrack[] = started.map(track => {
    const quiz = quizBy.get(track.lesson.id);
    const response = writtenBy.get(track.lesson.id);
    const times = [quiz?.at, response?.at].filter(Boolean).map(value => new Date(value as Date).getTime());
    return {
      kind: "track",
      key: `track-${track.id}`,
      number: track.dayNumber!,
      title: track.lesson.title,
      week: track.weekNumber,
      completed: track.completed,
      quizScore: quiz?.best ?? null,
      written: response ? response.status as HistoryTrack["written"] : null,
      lessonDone: track.progress.audioListened || track.progress.notesRead,
      at: times.length ? new Date(Math.max(...times)).toISOString() : null,
      href: `/dashboard/sogp/course/day/${track.dayNumber}`,
    };
  });

  // A review belongs to the cohort week it fell in.
  const start = new Date(course.cohort.startsAt).getTime();
  const weekOf = (at: Date) => Math.max(1, Math.floor((at.getTime() - start) / (7 * 86_400_000)) + 1);
  const reviewItems: HistoryReview[] = reviews.map(row => ({ kind: "review", key: `review-${row.id}`, title: row.title, status: row.status, at: row.startsAt.toISOString(), week: weekOf(row.startsAt) }));

  const byWeek = new Map<number, Array<HistoryTrack | HistoryReview>>();
  for (const item of [...tracks, ...reviewItems]) {
    const week = item.week ?? 1;
    byWeek.set(week, [...(byWeek.get(week) ?? []), item]);
  }
  const scores = tracks.map(track => track.quizScore).filter((score): score is number => score !== null);
  return {
    tracksDone: tracks.filter(track => track.completed).length,
    quizAverage: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null,
    responses: tracks.filter(track => track.written).length,
    weeks: [...byWeek.entries()].sort((a, b) => b[0] - a[0]).map(([week, items]) => ({
      week,
      items: items.sort((a, b) => (a.kind === "track" && b.kind === "track" ? b.number - a.number : (b.at ?? "").localeCompare(a.at ?? ""))),
    })),
  };
}
