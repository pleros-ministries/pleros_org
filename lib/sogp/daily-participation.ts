const LAGOS_OFFSET = "+01:00";
const DAY_MS = 24 * 60 * 60 * 1000;

export const DAILY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type DailyParticipationRow = {
  enrollmentId: number;
  name: string;
  email: string;
  pastorId: string | null;
  pastorName: string | null;
  prayerWatch: boolean;
  /** null = no lesson was released that day, so the column doesn't apply. */
  listened: boolean | null;
  quizAttempted: boolean;
  writtenSubmitted: boolean;
  writtenApproved: boolean;
  reviewAttended: boolean;
};

export type DailyPastorSummary = {
  pastorId: string | null;
  pastorName: string;
  enrollees: number;
  prayerWatch: number;
  listened: number;
  listenedApplicable: boolean;
  quizAttempted: number;
  writtenSubmitted: number;
  writtenApproved: number;
  reviewAttended: number;
};

// Lagos has no DST, so a fixed +01:00 offset is exact.
export function lagosDayRange(dateKey: string): { start: Date; end: Date } {
  const start = new Date(`${dateKey}T00:00:00${LAGOS_OFFSET}`);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** Same fixed-offset logic as `lagosDayRange`, spanning every day from
 * `startDateKey` through `endDateKey` inclusive. */
export function lagosRange(startDateKey: string, endDateKey: string): { start: Date; end: Date } {
  const start = new Date(`${startDateKey}T00:00:00${LAGOS_OFFSET}`);
  const endDayStart = new Date(`${endDateKey}T00:00:00${LAGOS_OFFSET}`);
  return { start, end: new Date(endDayStart.getTime() + DAY_MS) };
}

/** The Lagos calendar day a UTC timestamp falls on, as a `DAILY_DATE_PATTERN` key. */
export function toLagosDateKey(date: Date): string {
  const lagos = new Date(date.getTime() + 60 * 60 * 1000);
  return lagos.toISOString().slice(0, 10);
}

/** Every calendar day from `startDateKey` through `endDateKey`, inclusive. Pure
 * calendar-date arithmetic (UTC), independent of any timezone offset. */
export function enumerateDateKeys(startDateKey: string, endDateKey: string): string[] {
  const [sy, sm, sd] = startDateKey.split("-").map(Number);
  const [ey, em, ed] = endDateKey.split("-").map(Number);
  const keys: string[] = [];
  let cursor = Date.UTC(sy!, sm! - 1, sd!);
  const end = Date.UTC(ey!, em! - 1, ed!);
  while (cursor <= end) {
    keys.push(new Date(cursor).toISOString().slice(0, 10));
    cursor += DAY_MS;
  }
  return keys;
}

/**
 * One enrollee's participation on one day within a date-range query. Only
 * carries the three activities the student-status classifier cares about
 * (teaching, morning prayer, review) — unlike `DailyParticipationRow`, it
 * also distinguishes "no review session was scheduled that day"
 * (`reviewApplicable: false`, `reviewAttended: null`) from "a session
 * happened and they skipped it" (`reviewApplicable: true`,
 * `reviewAttended: false`), which a single day's boolean can't express.
 */
export type RangeParticipationRow = {
  enrollmentId: number;
  dateKey: string;
  listened: boolean | null;
  prayerWatch: boolean;
  reviewApplicable: boolean;
  reviewAttended: boolean | null;
};

function summarize(
  pastorId: string | null,
  pastorName: string,
  rows: DailyParticipationRow[],
): DailyPastorSummary {
  const count = (pick: (row: DailyParticipationRow) => boolean) => rows.filter(pick).length;
  return {
    pastorId,
    pastorName,
    enrollees: rows.length,
    prayerWatch: count((row) => row.prayerWatch),
    listened: count((row) => row.listened === true),
    listenedApplicable: rows.some((row) => row.listened !== null),
    quizAttempted: count((row) => row.quizAttempted),
    writtenSubmitted: count((row) => row.writtenSubmitted),
    writtenApproved: count((row) => row.writtenApproved),
    reviewAttended: count((row) => row.reviewAttended),
  };
}

export function summarizeDailyByPastor(rows: DailyParticipationRow[]): {
  pastors: DailyPastorSummary[];
  total: DailyPastorSummary;
} {
  const groups = new Map<string, DailyParticipationRow[]>();
  for (const row of rows) {
    const key = row.pastorId ?? "";
    const bucket = groups.get(key);
    if (bucket) bucket.push(row);
    else groups.set(key, [row]);
  }

  const pastors = Array.from(groups.values())
    .map((members) => {
      const first = members[0]!;
      return summarize(first.pastorId, first.pastorName ?? "Unassigned", members);
    })
    .sort((a, b) => b.enrollees - a.enrollees || a.pastorName.localeCompare(b.pastorName));

  return { pastors, total: summarize(null, "All enrollees", rows) };
}
