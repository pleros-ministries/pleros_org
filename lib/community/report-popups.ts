import { BIBLE_BOOKS, getBibleBook } from "@/lib/bible-reading";
import type { MinistryContact } from "@/lib/community/reporting-v3";

/**
 * Pure rules for the report pop-ups (Pastor, 18 October workers' meeting):
 * chapter-a-day Bible plans, the Teaching report, evangelism style and the
 * discipleship actions. Shared by the server queries and the client sheets.
 */

export const BIBLE_PLAN_CHOICES = [2, 3, 5] as const;
export const BIBLE_PLAN_MAX = 50;
export const BIBLE_DAY_MAX = 150;

export type BiblePosition = { book: string; chapter: number };
export type BiblePlan = { chaptersPerDay: number; startBook: string; startChapter: number; startedOn: string };

/** The chapter after this one, into the next book, and back to Genesis after Revelation. */
export function nextChapter({ book, chapter }: BiblePosition): BiblePosition {
  const index = BIBLE_BOOKS.findIndex(row => row.name === book);
  if (index < 0) return { book: BIBLE_BOOKS[0].name, chapter: 1 };
  if (chapter < BIBLE_BOOKS[index].chapters) return { book, chapter: chapter + 1 };
  return { book: BIBLE_BOOKS[(index + 1) % BIBLE_BOOKS.length].name, chapter: 1 };
}

/** The last chapter of a reading of `count` chapters that starts at `start`. */
export function readingEnd(start: BiblePosition, count: number): BiblePosition {
  let end = start;
  for (let read = 1; read < count; read += 1) end = nextChapter(end);
  return end;
}

/** "Romans 4–6", "Romans 4", or "Romans 15 – 1 Corinthians 2". */
export function readingLabel(start: BiblePosition, end: BiblePosition): string {
  if (start.book !== end.book) return `${start.book} ${start.chapter} – ${end.book} ${end.chapter}`;
  return start.chapter === end.chapter ? `${start.book} ${start.chapter}` : `${start.book} ${start.chapter}–${end.chapter}`;
}

export function validPlanStart(book: unknown, chapter: unknown): BiblePosition | null {
  const found = typeof book === "string" ? getBibleBook(book) : null;
  if (!found || typeof chapter !== "number" || !Number.isInteger(chapter) || chapter < 1 || chapter > found.chapters) return null;
  return { book: found.name, chapter };
}

/**
 * Where the plan stands on a day: the reading starts after the latest log
 * before that day (if it came after the plan was set), else at the plan start.
 */
export function planReading(plan: BiblePlan, previous: (BiblePosition & { dateKey: string }) | null, chapters = plan.chaptersPerDay) {
  const start = previous && previous.dateKey >= plan.startedOn && getBibleBook(previous.book)
    ? nextChapter(previous)
    : { book: plan.startBook, chapter: plan.startChapter };
  const end = readingEnd(start, chapters);
  return { start, end, chapters, label: readingLabel(start, end) };
}

/** Whole days since the plan started, counting the start as day 1. */
export function planDay(plan: BiblePlan, dateKey: string): number {
  const days = Math.round((Date.parse(`${dateKey}T00:00:00Z`) - Date.parse(`${plan.startedOn}T00:00:00Z`)) / 86_400_000);
  return Math.max(1, days + 1);
}

export const TEACHING_SOURCES = [
  { key: "sogp", label: "SOGP" },
  { key: "podcast", label: "Podcast" },
  { key: "both", label: "Both" },
] as const;
export type TeachingSource = (typeof TEACHING_SOURCES)[number]["key"];
export const TEACHING_NOTE_MAX = 500;
export const isTeachingSource = (value: unknown): value is TeachingSource => TEACHING_SOURCES.some(row => row.key === value);

export type EvangelismStyle = "broadcast" | "direct";
export const isEvangelismStyle = (value: unknown): value is EvangelismStyle => value === "broadcast" || value === "direct";
/** How a one-to-one conversation happened; the activity's mode and platform follow from it. */
export const DIRECT_METHODS = ["In person", "Call", "WhatsApp", "Visit"] as const;
export function directMode(method: string): { mode: "online" | "offline"; platform?: string } {
  if (method === "Call") return { mode: "online", platform: "phone" };
  if (method === "WhatsApp") return { mode: "online", platform: "whatsapp" };
  return { mode: "offline" };
}

/** Discipleship ticks (Pastor: "dropdown or tickable" instead of writing it out). */
export const DISCIPLESHIP_ACTIONS = [
  { key: "taught", label: "Taught" },
  { key: "prayed", label: "Prayed together" },
  { key: "bible_study", label: "Bible study" },
  { key: "checked_in", label: "Checked in" },
  { key: "visited", label: "Visited" },
  { key: "counselled", label: "Counselled" },
  { key: "brought_to_meeting", label: "Brought to a meeting" },
] as const;
export type DiscipleshipAction = (typeof DISCIPLESHIP_ACTIONS)[number]["key"];
export const discipleshipActionLabel = (key: string) => DISCIPLESHIP_ACTIONS.find(row => row.key === key)?.label ?? key;

export const PERSON_OUTCOMES = ["saved", "filled", "healed"] as const;
export type PersonOutcome = (typeof PERSON_OUTCOMES)[number];
export type ContactOutcomes = Record<string, PersonOutcome[]>;

/** Totals for the activity's saved/filled/healed numbers from each person's ticks. */
export function outcomeTotals(outcomes: ContactOutcomes): Record<PersonOutcome, number> {
  const totals = { saved: 0, filled: 0, healed: 0 };
  for (const ticks of Object.values(outcomes)) for (const tick of ticks) totals[tick] += 1;
  return totals;
}

/** A saved evangelism or discipleship report, as its pop-up reopens it for editing. */
export type MinistryEdit = {
  activityId: number; kind: "outreach" | "follow_up"; style: EvangelismStyle | null;
  method: string; context: string; note: string; peopleCount: number;
  platform: string; platformOther: string; onlineCount: number; offlineCount: number;
  outcomes: Partial<Record<string, string>>; contacts: MinistryContact[];
  actions: DiscipleshipAction[]; contactOutcomes: ContactOutcomes;
};

/**
 * Builds the edit state from the activity, its report entry, its contacts and
 * its pop-up details. Without a details row (before migration 0068), a call,
 * WhatsApp or visit method still marks the report as one-to-one.
 */
export function ministryEdit(
  activity: { id: number; kind: string; note: string | null; platform: string | null; reachedOnline: number; reachedOffline: number; followUps: number },
  entry: { method: string; context: string | null; enteredOutcomes: Partial<Record<string, string>> },
  contacts: MinistryContact[],
  details: { style: EvangelismStyle | null; actions: DiscipleshipAction[]; contactOutcomes: ContactOutcomes } | undefined,
): MinistryEdit | null {
  if (activity.kind !== "outreach" && activity.kind !== "follow_up") return null;
  const outreach = activity.kind === "outreach";
  const style = outreach ? details?.style ?? (["Call", "WhatsApp", "Visit"].includes(entry.method) ? "direct" : "broadcast") : null;
  const other = activity.platform?.startsWith("other:") ? activity.platform.slice(6) : null;
  return {
    activityId: activity.id, kind: activity.kind, style, method: entry.method, context: entry.context ?? "", note: activity.note ?? "",
    peopleCount: Math.max(contacts.length, outreach ? activity.reachedOnline + activity.reachedOffline : activity.followUps),
    platform: other !== null ? "other" : activity.platform ?? "", platformOther: other ?? "",
    onlineCount: activity.reachedOnline, offlineCount: activity.reachedOffline,
    outcomes: entry.enteredOutcomes, contacts,
    actions: outreach ? [] : details?.actions ?? [], contactOutcomes: style === "direct" ? details?.contactOutcomes ?? {} : {},
  };
}
