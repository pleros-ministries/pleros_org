/**
 * The monthly leaderboard (Pastor, 25 November 2026): everyone on one board
 * for the calendar month in Lagos, starting afresh on the 1st. Learning paths
 * stay individual; only the scoring is shared. Pure rules only.
 */

export const MONTHLY_POINTS = {
  /** A Lagos day with any learning done, however much. */
  learningDay: 5,
  /** A Prayer Watch session, up to `PRAYER_SESSIONS_PER_DAY` a day. */
  prayerSession: 2,
  /** A Lagos day with Bible reading recorded. */
  bibleDay: 3,
  /** A person who joined your groups, a group under you, or signed up with your link. */
  invitation: 10,
} as const;

export const PRAYER_SESSIONS_PER_DAY = 3;
/** Prayer Watch and Bible reading count when recorded within this many days, as reports allow. */
export const LATE_RECORD_DAYS = 7;
export const MONTHLY_MAX_LISTED = 100;

export type MonthlyCounts = {
  learningDays: number;
  prayerSessions: number;
  bibleDays: number;
  invitations: number;
};

export type MonthlyBreakdown = {
  learning: number;
  prayer: number;
  bible: number;
  invitations: number;
  total: number;
};

export type MonthWindow = {
  /** "2026-11" */
  key: string;
  /** "2026-11-01" */
  startKey: string;
  todayKey: string;
  /** "November 2026" */
  label: string;
  /** "November" */
  name: string;
  daysInMonth: number;
  /** Days so far, today included. */
  daysSoFar: number;
  /** Days left, today included. */
  daysLeft: number;
};

export type MonthlyEntry = { rank: number; name: string; points: number; isMe: boolean };

export type MonthlyMe = {
  /** On the board, the rank they would hold while hidden, or null with no points yet. */
  rank: number | null;
  points: number;
  counts: MonthlyCounts;
  breakdown: MonthlyBreakdown;
  firstName: string;
  alias: string | null;
  hidden: boolean;
};

export type MonthlyLeaderboardData = {
  month: MonthWindow;
  /** The visible board, best first, without user ids. */
  top: MonthlyEntry[];
  /** Everyone visible on the board this month. */
  total: number;
  me: MonthlyMe;
};

export const EMPTY_MONTHLY_COUNTS: MonthlyCounts = {
  learningDays: 0,
  prayerSessions: 0,
  bibleDays: 0,
  invitations: 0,
};

const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const monthName = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

/** The calendar month a Lagos date key falls in. */
export function monthWindow(todayKey: string): MonthWindow {
  const [year, month, day] = todayKey.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    key: todayKey.slice(0, 7),
    startKey: `${todayKey.slice(0, 7)}-01`,
    todayKey,
    label: monthLabel.format(first),
    name: monthName.format(first),
    daysInMonth,
    daysSoFar: day,
    daysLeft: daysInMonth - day + 1,
  };
}

export function scoreMonth(counts: MonthlyCounts): MonthlyBreakdown {
  const learning = counts.learningDays * MONTHLY_POINTS.learningDay;
  const prayer = counts.prayerSessions * MONTHLY_POINTS.prayerSession;
  const bible = counts.bibleDays * MONTHLY_POINTS.bibleDay;
  const invitations = counts.invitations * MONTHLY_POINTS.invitation;
  return { learning, prayer, bible, invitations, total: learning + prayer + bible + invitations };
}

/** Dense ranking: equal points share a rank and the next rank follows directly. */
export function rankByPoints<T extends { points: number; name: string }>(rows: readonly T[]): Array<T & { rank: number }> {
  const sorted = [...rows].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  let rank = 0;
  let lastPoints: number | null = null;
  return sorted.map((row) => {
    if (row.points !== lastPoints) {
      rank += 1;
      lastPoints = row.points;
    }
    return { ...row, rank };
  });
}

/** The rank a score would hold among the visible scores. */
export function denseRankFor(points: number, visiblePoints: readonly number[]) {
  return new Set(visiblePoints.filter((value) => value > points)).size + 1;
}

/**
 * The board as the viewer sees it after hiding, showing or renaming
 * themselves, so those saves show at once. Everyone else keeps their place.
 */
export function placeViewer(data: MonthlyLeaderboardData, view: { hidden: boolean; name: string }) {
  const { me } = data;
  const others = data.top.filter((row) => !row.isMe);
  const wasOnBoard = !me.hidden && me.points > 0;
  const othersTotal = data.total - (wasOnBoard ? 1 : 0);

  if (view.hidden || me.points === 0) {
    return {
      rows: rankByPoints(others).map((row) => ({ ...row, isMe: false })),
      outside: null,
      myRank: me.points > 0 ? denseRankFor(me.points, others.map((row) => row.points)) : null,
      total: othersTotal,
    };
  }

  const ranked = rankByPoints([...others, { name: view.name, points: me.points, isMe: true }]);
  const mine = ranked.find((row) => row.isMe)!;
  const rows = ranked.slice(0, MONTHLY_MAX_LISTED);
  return {
    rows,
    // Further down than the board lists: shown after a gap.
    outside: rows.includes(mine) ? null : mine,
    myRank: mine.rank,
    total: othersTotal + 1,
  };
}
