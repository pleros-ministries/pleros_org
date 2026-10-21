import "server-only";

import { and, desc, eq, inArray, isNotNull, max, sql } from "drizzle-orm";

import { CommunityError } from "@/lib/community/errors";
import { MEETING_ACTIVITY_KIND, parseMeetingInput, parseNoReason, type MeetingRole, type NoPart } from "@/lib/community/meeting-report";
import { ACTIVITIES_PER_DAY_MAX } from "@/lib/community/ministry-activities";
import { reportableDateKeys } from "@/lib/community/ministry-report";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import { lagosToday } from "@/lib/sogp/daily-date";

import { clearDeclaredNil, lockDailyReporting } from "./daily-report-declarations";
import type { Tx } from "./outreach-contacts";

/**
 * My reports answered Yes or No (Pastor, 21 October; migration 0075). A No
 * keeps its reason; both ministry parts No, or meetings No, also record the
 * existing "nil" declaration, so every report status reads as before. Saving
 * evangelism, discipleship or a meeting clears that part's No.
 */

export type NoReasons = Partial<Record<NoPart, string>>;
export type OwnMeetingDetail = { activityId: number; role: MeetingRole; startsAt: string | null; endsAt: string | null; workers: number | null; members: number | null; peopleBrought: number };

const PART_KINDS = { evangelism: ["outreach"], discipleship: ["follow_up"], meetings: ["teaching_meeting", "prayer_meeting", "church_service", "other", "outreach_meeting"] } as const;
const PART_WORD = { evangelism: "evangelism", discipleship: "discipleship", meetings: "a meeting" } as const;

const missingTable = (error: unknown) => String((error as { cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code) === "42P01";

function requireWritable(dateKey: string) {
  if (!reportableDateKeys(lagosToday()).includes(dateKey)) throw new CommunityError("Reports can be changed for today and the previous seven days.");
}

async function upsertNil(tx: Tx, userId: string, dateKey: string, category: "ministry" | "meetings") {
  await tx.insert(s.dailyReportDeclarations).values({ userId, actorUserId: userId, reportDate: dateKey, category, declaration: "nil" })
    .onConflictDoUpdate({ target: [s.dailyReportDeclarations.userId, s.dailyReportDeclarations.reportDate, s.dailyReportDeclarations.category], set: { declaration: "nil", actorUserId: userId, updatedAt: new Date() } });
}

/** Called by every save of an evangelism, discipleship or meeting report, inside its transaction. */
export async function clearNoReason(tx: Tx, userId: string, dateKey: string, part: NoPart) {
  await tx.delete(s.dailyReportNoReasons).where(and(eq(s.dailyReportNoReasons.userId, userId), eq(s.dailyReportNoReasons.reportDate, dateKey), eq(s.dailyReportNoReasons.part, part)));
}

export async function getOwnNoReasons(userId: string, dateKey: string): Promise<NoReasons> {
  try {
    const rows = await db.select({ part: s.dailyReportNoReasons.part, reason: s.dailyReportNoReasons.reason }).from(s.dailyReportNoReasons)
      .where(and(eq(s.dailyReportNoReasons.userId, userId), eq(s.dailyReportNoReasons.reportDate, dateKey)));
    return Object.fromEntries(rows.map(row => [row.part, row.reason]));
  } catch (error) {
    if (missingTable(error)) return {};
    throw error;
  }
}

export async function saveOwnNoReason(userId: string, input: { dateKey: string; part: NoPart; reason: string }) {
  requireWritable(input.dateKey);
  if (!(input.part in PART_KINDS)) throw new CommunityError("Choose what you’re answering.");
  const parsed = parseNoReason(input.reason);
  if (!parsed.ok) throw new CommunityError(parsed.error);
  await transactionDb.transaction(async (tx) => {
    await lockDailyReporting(tx, userId, input.dateKey);
    const [logged] = await tx.select({ n: sql<number>`count(*)::int` }).from(s.ministryActivities)
      .where(and(eq(s.ministryActivities.userId, userId), eq(s.ministryActivities.activityDate, input.dateKey), inArray(s.ministryActivities.kind, [...PART_KINDS[input.part]])));
    if (logged.n) throw new CommunityError(`You’ve already reported ${PART_WORD[input.part]} for this day. Remove it first to answer No.`);
    await tx.insert(s.dailyReportNoReasons).values({ userId, reportDate: input.dateKey, part: input.part, reason: parsed.value })
      .onConflictDoUpdate({ target: [s.dailyReportNoReasons.userId, s.dailyReportNoReasons.reportDate, s.dailyReportNoReasons.part], set: { reason: parsed.value, updatedAt: new Date() } });
    if (input.part === "meetings") { await upsertNil(tx, userId, input.dateKey, "meetings"); return; }
    // Ministry is "nothing today" only once both evangelism and discipleship are No.
    const other = input.part === "evangelism" ? "discipleship" : "evangelism";
    const [otherNo] = await tx.select({ part: s.dailyReportNoReasons.part }).from(s.dailyReportNoReasons)
      .where(and(eq(s.dailyReportNoReasons.userId, userId), eq(s.dailyReportNoReasons.reportDate, input.dateKey), eq(s.dailyReportNoReasons.part, other)));
    if (otherNo) await upsertNil(tx, userId, input.dateKey, "ministry");
  });
}

/** Taking a No back, before answering Yes. */
export async function clearOwnNoReason(userId: string, input: { dateKey: string; part: NoPart }) {
  requireWritable(input.dateKey);
  if (!(input.part in PART_KINDS)) throw new CommunityError("Choose what you’re answering.");
  await transactionDb.transaction(async (tx) => {
    await lockDailyReporting(tx, userId, input.dateKey);
    await clearNoReason(tx, userId, input.dateKey, input.part);
    await clearDeclaredNil(tx, userId, input.dateKey, input.part === "meetings" ? "meetings" : "ministry");
  });
}

export async function getOwnMeetingReports(userId: string, dateKey: string): Promise<OwnMeetingDetail[]> {
  try {
    return await db.select({
      activityId: s.meetingReportDetails.activityId, role: s.meetingReportDetails.role,
      startsAt: s.meetingReportDetails.startsAt, endsAt: s.meetingReportDetails.endsAt,
      workers: s.meetingReportDetails.workers, members: s.meetingReportDetails.members, peopleBrought: s.meetingReportDetails.peopleBrought,
    }).from(s.meetingReportDetails)
      .innerJoin(s.ministryActivities, eq(s.ministryActivities.id, s.meetingReportDetails.activityId))
      .where(and(eq(s.ministryActivities.userId, userId), eq(s.ministryActivities.activityDate, dateKey)))
      .then(rows => rows.map(row => ({ ...row, startsAt: row.startsAt?.slice(0, 5) ?? null, endsAt: row.endsAt?.slice(0, 5) ?? null })));
  } catch (error) {
    if (missingTable(error)) return [];
    throw error;
  }
}

/** Venues of meetings this person led, most recent first, to pick from next time. */
export async function listOwnVenues(userId: string): Promise<string[]> {
  try {
    const last = max(s.ministryActivities.activityDate);
    const rows = await db.select({ venue: s.ministryActivities.location, last }).from(s.ministryActivities)
      .innerJoin(s.meetingReportDetails, eq(s.meetingReportDetails.activityId, s.ministryActivities.id))
      .where(and(eq(s.ministryActivities.userId, userId), eq(s.meetingReportDetails.role, "led"), isNotNull(s.ministryActivities.location)))
      .groupBy(s.ministryActivities.location).orderBy(desc(last)).limit(8);
    return rows.flatMap(row => row.venue ? [row.venue] : []);
  } catch (error) {
    if (missingTable(error)) return [];
    throw error;
  }
}

export async function saveOwnMeeting(userId: string, dateKey: string, raw: unknown) {
  requireWritable(dateKey);
  const parsed = parseMeetingInput(raw);
  if (!parsed.ok) throw new CommunityError(parsed.error);
  const meeting = parsed.value;
  return transactionDb.transaction(async (tx) => {
    await lockDailyReporting(tx, userId, dateKey);
    const day = await tx.select({ kind: s.ministryActivities.kind }).from(s.ministryActivities)
      .where(and(eq(s.ministryActivities.userId, userId), eq(s.ministryActivities.activityDate, dateKey)));
    if (day.length >= ACTIVITIES_PER_DAY_MAX) throw new CommunityError(`You can report up to ${ACTIVITIES_PER_DAY_MAX} activities a day.`);
    if (meeting.kind === "outreach" && !day.some(row => row.kind === "outreach" || row.kind === "follow_up")) {
      throw new CommunityError("Fill in Evangelism or Discipleship first. An outreach meeting is drawn from them.");
    }
    const led = meeting.role === "led";
    const [activity] = await tx.insert(s.ministryActivities).values({
      userId, activityDate: dateKey, kind: MEETING_ACTIVITY_KIND[meeting.kind],
      title: led ? meeting.emphasis : null, location: led ? meeting.venue : null,
      attendance: led ? (meeting.workers ?? 0) + (meeting.members ?? 0) : 0, note: meeting.note,
    }).returning({ id: s.ministryActivities.id });
    if (meeting.role) {
      await tx.insert(s.meetingReportDetails).values({
        activityId: activity.id, role: meeting.role, startsAt: meeting.startsAt, endsAt: meeting.endsAt,
        workers: meeting.workers, members: meeting.members, peopleBrought: meeting.brought,
      });
    }
    await clearNoReason(tx, userId, dateKey, "meetings");
    await clearDeclaredNil(tx, userId, dateKey, "meetings");
    return { activityId: activity.id };
  });
}
