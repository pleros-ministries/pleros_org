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

/** A leaderboard name: 2 to 24 letters or numbers; spaces, - and _ are fine too. */
export const LEADERBOARD_ALIAS_PATTERN = /^[\p{L}\p{N} _-]+$/u;
export const LEADERBOARD_ALIAS_HELP = "Use 2 to 24 letters or numbers. Spaces, - and _ are fine too.";

/**
 * The name to save: trimmed, with runs of spaces closed up; null to go back to
 * your first name; undefined when it breaks the rules.
 */
export function normaliseLeaderboardAlias(raw: string | null | undefined): string | null | undefined {
  if (raw == null) return null;
  if (typeof raw !== "string") return undefined;
  const alias = raw.trim().replace(/\s+/g, " ");
  if (!alias) return null;
  return alias.length >= 2 && alias.length <= 24 && LEADERBOARD_ALIAS_PATTERN.test(alias) ? alias : undefined;
}
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

/** One person's month as read from the database. */
export type MonthlyPerson = {
  userId: string;
  /** Their first name; peers never see more. */
  firstName: string;
  alias: string | null;
  hidden: boolean;
  counts: MonthlyCounts;
};

/**
 * The board for one viewer: everyone with points this month who hasn't hidden
 * themselves, best first, at most `MONTHLY_MAX_LISTED`, named by their
 * leaderboard name or first name. No user ids leave this function; the
 * viewer's row is marked `isMe`. A hidden viewer keeps a private rank.
 */
export function buildMonthlyLeaderboard(input: {
  month: MonthWindow;
  people: readonly MonthlyPerson[];
  viewerId: string;
  /** The viewer's own name and settings when they have no activity row. */
  viewer: { firstName: string; alias: string | null; hidden: boolean };
}): MonthlyLeaderboardData {
  const scored = input.people.map((person) => {
    const breakdown = scoreMonth(person.counts);
    return { person, breakdown, points: breakdown.total, name: person.alias ?? person.firstName };
  });
  const visible = scored.filter(({ person, points }) => points > 0 && !person.hidden);
  const ranked = rankByPoints(visible.map((row) => ({ name: row.name, points: row.points, isMe: row.person.userId === input.viewerId })));

  const own = scored.find(({ person }) => person.userId === input.viewerId);
  const counts = own?.person.counts ?? EMPTY_MONTHLY_COUNTS;
  const breakdown = own?.breakdown ?? scoreMonth(counts);
  const hidden = own?.person.hidden ?? input.viewer.hidden;
  const rank = breakdown.total > 0
    ? hidden ? denseRankFor(breakdown.total, visible.map((row) => row.points)) : ranked.find((row) => row.isMe)!.rank
    : null;

  return {
    month: input.month,
    top: ranked.slice(0, MONTHLY_MAX_LISTED).map(({ rank: place, name, points, isMe }) => ({ rank: place, name, points, isMe })),
    total: ranked.length,
    me: {
      rank,
      points: breakdown.total,
      counts,
      breakdown,
      firstName: own?.person.firstName ?? input.viewer.firstName,
      alias: own?.person.alias ?? input.viewer.alias,
      hidden,
    },
  };
}

/**
 * The board's top few for a preview (Home, the Podcast page), and you. A
 * hidden viewer sees the board without themselves; `points` is theirs either way.
 */
export function previewMonthlyLeaderboard(data: MonthlyLeaderboardData, size = 5) {
  return {
    month: data.month.name,
    top: data.top.slice(0, size),
    me: data.me.rank && !data.me.hidden ? { rank: data.me.rank, points: data.me.points } : null,
    total: data.total,
    points: data.me.points,
  };
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
      // A dense rank is the same whether or not you're listed.
      myRank: me.points > 0 ? me.rank ?? denseRankFor(me.points, others.map((row) => row.points)) : null,
      total: othersTotal,
    };
  }

  const ranked = rankByPoints([...others, { name: view.name, points: me.points, isMe: true }]);
  const mine = ranked.find((row) => row.isMe)!;
  const rows = ranked.slice(0, MONTHLY_MAX_LISTED);
  return {
    rows,
    // Further down than the board lists: shown after a gap, at the rank the
    // whole board gives it (the listed rows are only its top).
    outside: rows.includes(mine) ? null : { ...mine, rank: me.rank ?? mine.rank },
    myRank: rows.includes(mine) ? mine.rank : me.rank ?? mine.rank,
    total: othersTotal + 1,
  };
}
