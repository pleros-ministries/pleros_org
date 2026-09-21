export const LEADERBOARD_POINTS = {
  quizPassed: 10,
  writtenApproved: 10,
  dayCompleted: 5,
  prayerWatch: 2,
  review: 15,
  preparationDay: 3,
  share: 5,
  referral: 20,
  streakMilestone: 10,
} as const;

export const LEADERBOARD_SHARE_CAP = 10;
export const LEADERBOARD_STREAK_MILESTONE_DAYS = 7;
export const LEADERBOARD_MAX_LISTED = 100;

export type LeaderboardActivityCounts = {
  quizPassed: number;
  writtenApproved: number;
  daysCompleted: number;
  prayerWatch: number;
  reviews: number;
  preparationDays: number;
  shares: number;
  referrals: number;
};

export type LeaderboardBreakdown = {
  course: number;
  attendance: number;
  sharing: number;
  streak: number;
  total: number;
};

export const EMPTY_ACTIVITY_COUNTS: LeaderboardActivityCounts = {
  quizPassed: 0,
  writtenApproved: 0,
  daysCompleted: 0,
  prayerWatch: 0,
  reviews: 0,
  preparationDays: 0,
  shares: 0,
  referrals: 0,
};

function dayNumber(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Date.UTC(year, month - 1, day) / 86_400_000;
}

/**
 * `longest` drives the bonus so points never fall when a streak breaks;
 * `current` is display-only and stays alive through a not-yet-active today.
 */
export function computeStreaks(dateKeys: Iterable<string>, todayKey: string) {
  const today = dayNumber(todayKey);
  const days = Array.from(new Set(Array.from(dateKeys, dayNumber)))
    .filter((day) => day <= today)
    .sort((a, b) => a - b);

  let longest = 0;
  let run = 0;
  let previous: number | null = null;
  for (const day of days) {
    run = previous !== null && day === previous + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = day;
  }

  const current = previous !== null && previous >= today - 1 ? run : 0;
  return { longest, current };
}

export function scoreParticipant(
  counts: LeaderboardActivityCounts,
  longestStreak: number,
): LeaderboardBreakdown {
  const course =
    counts.quizPassed * LEADERBOARD_POINTS.quizPassed +
    counts.writtenApproved * LEADERBOARD_POINTS.writtenApproved +
    counts.daysCompleted * LEADERBOARD_POINTS.dayCompleted;
  const attendance =
    counts.prayerWatch * LEADERBOARD_POINTS.prayerWatch +
    counts.reviews * LEADERBOARD_POINTS.review +
    counts.preparationDays * LEADERBOARD_POINTS.preparationDay;
  const sharing =
    Math.min(counts.shares, LEADERBOARD_SHARE_CAP) * LEADERBOARD_POINTS.share +
    counts.referrals * LEADERBOARD_POINTS.referral;
  const streak =
    Math.floor(longestStreak / LEADERBOARD_STREAK_MILESTONE_DAYS) *
    LEADERBOARD_POINTS.streakMilestone;

  return {
    course,
    attendance,
    sharing,
    streak,
    total: course + attendance + sharing + streak,
  };
}

/** Dense ranking: equal points share a rank and the next rank follows directly. */
export function rankByPoints<T extends { points: number; name: string }>(
  rows: T[],
): Array<T & { rank: number }> {
  const sorted = [...rows].sort(
    (a, b) => b.points - a.points || a.name.localeCompare(b.name),
  );
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

export function denseRankFor(points: number, visiblePoints: number[]) {
  const higher = new Set(visiblePoints.filter((value) => value > points));
  return higher.size + 1;
}
