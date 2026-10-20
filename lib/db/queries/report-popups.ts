import "server-only";

import { and, desc, eq, gte, inArray, lt, sql } from "drizzle-orm";

import { CommunityError } from "@/lib/community/errors";
import { BIBLE_DAY_MAX, BIBLE_PLAN_MAX, TEACHING_NOTE_MAX, TEACHING_OTHER_MAX, isTeachingSource, planDay, planReading, validPlanStart, type BiblePlan, type TeachingSource } from "@/lib/community/report-popups";
import type { MinistryReportDetails } from "@/lib/community/reporting-v3-input";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import type { Tx } from "./outreach-contacts";

import { upsertBibleReadingLog } from "./bible-reading";
import { writableReportDate } from "./reporting-v3-store";

/**
 * Bible plans, Teaching reports and ministry details for the report pop-ups
 * (migration 0068). Until it is applied, reads come back empty, ministry saves
 * keep their numbers without the extra details, and plan/teaching writes are
 * refused with a message.
 */

let ready: boolean | null = null;
/** True once migration 0068's tables exist; a positive answer is remembered. */
export async function reportPopupsReady(): Promise<boolean> {
  if (ready) return true;
  const [row] = await db.execute<{ ok: boolean }>(sql`select to_regclass('public.ministry_report_details') is not null and to_regclass('public.bible_reading_plans') is not null and to_regclass('public.daily_teaching_reports') is not null as ok`).then(result => result.rows);
  ready = Boolean(row?.ok);
  return ready;
}
async function requireReady() {
  if (!await reportPopupsReady()) throw new CommunityError("This part of the report isn't switched on yet. Try again later.");
}

// ─── Ministry details ──────────────────────────────────────────────────────

/** Caller holds the report transaction; skipped quietly before migration 0068. */
export async function writeMinistryDetails(tx: Tx, activityId: number, details: MinistryReportDetails) {
  if (!await reportPopupsReady()) return;
  // The older edit form sends none of these; keep what the pop-up saved.
  if (!details.style && !details.actions.length && !Object.keys(details.contactOutcomes).length) return;
  const row = { style: details.style, actions: details.actions, contactOutcomes: details.contactOutcomes };
  await tx.insert(s.ministryReportDetails).values({ activityId, ...row }).onConflictDoUpdate({ target: s.ministryReportDetails.activityId, set: row });
}

export async function listMinistryDetails(activityIds: number[]): Promise<Record<number, MinistryReportDetails>> {
  if (!activityIds.length || !await reportPopupsReady()) return {};
  const rows = await db.select().from(s.ministryReportDetails).where(inArray(s.ministryReportDetails.activityId, activityIds));
  return Object.fromEntries(rows.map(row => [row.activityId, { style: row.style, actions: row.actions as MinistryReportDetails["actions"], contactOutcomes: row.contactOutcomes }]));
}

// ─── Bible reading plan ────────────────────────────────────────────────────

export type BibleDay = {
  plan: (BiblePlan & { day: number; readSince: number }) | null;
  /** Today's reading on the plan, from where the last log left off. */
  reading: { label: string; chapters: number; start: { book: string; chapter: number } } | null;
  /** What was logged for the day, if anything. */
  logged: { chapters: number; book: string; chapter: number } | null;
};

async function previousLog(userId: string, dateKey: string) {
  const [row] = await db.select({ dateKey: s.bibleReadingLogs.readingDate, book: s.bibleReadingLogs.currentBook, chapter: s.bibleReadingLogs.currentChapter })
    .from(s.bibleReadingLogs).where(and(eq(s.bibleReadingLogs.userId, userId), lt(s.bibleReadingLogs.readingDate, dateKey)))
    .orderBy(desc(s.bibleReadingLogs.readingDate)).limit(1);
  return row ?? null;
}
async function readPlan(userId: string): Promise<BiblePlan | null> {
  const [row] = await db.select().from(s.bibleReadingPlans).where(eq(s.bibleReadingPlans.userId, userId));
  return row ? { chaptersPerDay: row.chaptersPerDay, startBook: row.startBook, startChapter: row.startChapter, startedOn: row.startedOn } : null;
}

export async function getBibleDay(userId: string, dateKey: string, logged: BibleDay["logged"]): Promise<BibleDay> {
  if (!await reportPopupsReady()) return { plan: null, reading: null, logged };
  const plan = await readPlan(userId);
  if (!plan) return { plan: null, reading: null, logged };
  const [previous, [{ total }]] = await Promise.all([
    previousLog(userId, dateKey),
    db.select({ total: sql<number>`coalesce(sum(${s.bibleReadingLogs.chaptersRead}), 0)::int` }).from(s.bibleReadingLogs)
      .where(and(eq(s.bibleReadingLogs.userId, userId), gte(s.bibleReadingLogs.readingDate, plan.startedOn), lt(s.bibleReadingLogs.readingDate, dateKey))),
  ]);
  const reading = planReading(plan, previous);
  return { plan: { ...plan, day: planDay(plan, dateKey), readSince: total }, reading: { label: reading.label, chapters: reading.chapters, start: reading.start }, logged };
}

export async function saveBiblePlan(userId: string, input: { dateKey: unknown; chaptersPerDay: unknown; book: unknown; chapter: unknown }) {
  await requireReady();
  const dateKey = writableReportDate(input.dateKey);
  const perDay = input.chaptersPerDay;
  if (typeof perDay !== "number" || !Number.isInteger(perDay) || perDay < 1 || perDay > BIBLE_PLAN_MAX) throw new CommunityError(`Choose from 1 to ${BIBLE_PLAN_MAX} chapters a day.`);
  const start = validPlanStart(input.book, input.chapter);
  if (!start) throw new CommunityError("Choose a book and a chapter in it.");
  const row = { chaptersPerDay: perDay, startBook: start.book, startChapter: start.chapter, startedOn: dateKey, updatedAt: new Date() };
  await db.insert(s.bibleReadingPlans).values({ userId, ...row }).onConflictDoUpdate({ target: s.bibleReadingPlans.userId, set: row });
}

/** Logs the day's plan reading, or a different number of chapters from the same place. */
export async function logPlanReading(userId: string, input: { dateKey: unknown; chapters?: unknown }) {
  await requireReady();
  const dateKey = writableReportDate(input.dateKey);
  const plan = await readPlan(userId);
  if (!plan) throw new CommunityError("Choose a reading plan first.");
  const chapters = input.chapters ?? plan.chaptersPerDay;
  if (typeof chapters !== "number" || !Number.isInteger(chapters) || chapters < 1 || chapters > BIBLE_DAY_MAX) throw new CommunityError(`Enter from 1 to ${BIBLE_DAY_MAX} chapters.`);
  const reading = planReading(plan, await previousLog(userId, dateKey), chapters);
  await upsertBibleReadingLog({ userId, dateKey, chaptersRead: chapters, currentBook: reading.end.book, currentChapter: reading.end.chapter });
  return { label: reading.label };
}

// ─── Teaching ──────────────────────────────────────────────────────────────

export type TeachingReport = { source: TeachingSource; otherTitle: string | null; note: string | null };

export async function getTeachingReport(userId: string, dateKey: string): Promise<TeachingReport | null> {
  if (!await reportPopupsReady()) return null;
  const [row] = await db.select({ source: s.dailyTeachingReports.source, otherTitle: s.dailyTeachingReports.otherTitle, note: s.dailyTeachingReports.note }).from(s.dailyTeachingReports)
    .where(and(eq(s.dailyTeachingReports.userId, userId), eq(s.dailyTeachingReports.reportDate, dateKey)));
  return row ?? null;
}

export async function saveTeachingReport(userId: string, input: { dateKey: unknown; source: unknown; otherTitle?: unknown; note: unknown }) {
  await requireReady();
  const dateKey = writableReportDate(input.dateKey);
  if (!isTeachingSource(input.source)) throw new CommunityError("Choose SOGP, the podcast or Other.");
  if (input.otherTitle != null && typeof input.otherTitle !== "string") throw new CommunityError("Enter what the teaching was.");
  const otherTitle = (input.otherTitle as string | null | undefined)?.replace(/\s+/g, " ").trim() || null;
  if (otherTitle && otherTitle.length > TEACHING_OTHER_MAX) throw new CommunityError(`Keep the teaching’s name under ${TEACHING_OTHER_MAX} characters.`);
  if (input.source === "none" && !otherTitle) throw new CommunityError("Say what the other teaching was.");
  if (input.note != null && typeof input.note !== "string") throw new CommunityError("Enter a valid note.");
  const note = (input.note as string | null)?.trim() || null;
  if (note && note.length > TEACHING_NOTE_MAX) throw new CommunityError(`Keep the note under ${TEACHING_NOTE_MAX} characters.`);
  const row = { source: input.source, otherTitle, note, updatedAt: new Date() };
  await db.insert(s.dailyTeachingReports).values({ userId, reportDate: dateKey, ...row }).onConflictDoUpdate({ target: [s.dailyTeachingReports.userId, s.dailyTeachingReports.reportDate], set: row });
}

// ─── Recent teachings ──────────────────────────────────────────────────────

/** Titles of the member's cohort teachings released in the week up to the end of the day, newest first. */
export async function listRecentTeachingTitles(userId: string, dateKey: string): Promise<string[]> {
  const [enrollment] = await db.select({ cohortId: s.sogpEnrollments.cohortId }).from(s.sogpEnrollments)
    .where(eq(s.sogpEnrollments.userId, userId)).orderBy(desc(s.sogpEnrollments.createdAt)).limit(1);
  if (!enrollment?.cohortId) return [];
  const end = new Date(Date.parse(`${dateKey}T23:00:00Z`)); // end of the Lagos day (UTC+1)
  const rows = await db.select({ title: s.lessons.title }).from(s.sogpCohortTracks)
    .innerJoin(s.lessons, eq(s.lessons.id, s.sogpCohortTracks.lessonId))
    .where(and(eq(s.sogpCohortTracks.cohortId, enrollment.cohortId), lt(s.sogpCohortTracks.releaseAt, end), gte(s.sogpCohortTracks.releaseAt, new Date(end.getTime() - 7 * 86_400_000))))
    .orderBy(desc(s.sogpCohortTracks.releaseAt)).limit(3);
  return [...new Set(rows.map(row => row.title))];
}
