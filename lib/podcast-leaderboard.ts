import {
  computeStreaks,
  LEADERBOARD_MAX_LISTED,
  LEADERBOARD_POINTS,
  LEADERBOARD_STREAK_MILESTONE_DAYS,
  rankByPoints,
} from "./sogp/leaderboard-scoring";

export const PODCAST_LEADERBOARD_POINTS = {
  episode: 5,
  prayerWatch: LEADERBOARD_POINTS.prayerWatch,
  streakMilestone: LEADERBOARD_POINTS.streakMilestone,
} as const;

export type PodcastLeaderboardBreakdown = {
  episodes: number;
  prayer: number;
  streak: number;
  total: number;
};

export type PodcastLeaderboardEntry = {
  rank: number;
  name: string;
  points: number;
  currentStreak: number;
  isMe: boolean;
};

export type PodcastLeaderboardMe = {
  rank: number;
  points: number;
  currentStreak: number;
  longestStreak: number;
  breakdown: PodcastLeaderboardBreakdown;
};

export type PodcastLeaderboardData = {
  monthLabel: string;
  top: PodcastLeaderboardEntry[];
  total: number;
  me: PodcastLeaderboardMe | null;
};

/** What the scorer needs for one listener; `name` is already the public name. */
export type PodcastLeaderboardListener = {
  userId: string;
  name: string;
  episodes: number;
  prayerWatch: number;
  activityDays: Iterable<string>;
};

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function podcastLeaderboardMonthLabel(todayKey: string) {
  return monthFormatter.format(new Date(`${todayKey.slice(0, 7)}-01T00:00:00.000Z`));
}

export function scorePodcastListener(
  counts: { episodes: number; prayerWatch: number },
  longestStreak: number,
): PodcastLeaderboardBreakdown {
  const episodes = counts.episodes * PODCAST_LEADERBOARD_POINTS.episode;
  const prayer = counts.prayerWatch * PODCAST_LEADERBOARD_POINTS.prayerWatch;
  const streak =
    Math.floor(longestStreak / LEADERBOARD_STREAK_MILESTONE_DAYS) *
    PODCAST_LEADERBOARD_POINTS.streakMilestone;

  return { episodes, prayer, streak, total: episodes + prayer + streak };
}

/**
 * Ranks this month's listeners. The result carries no user ids: the viewer is
 * marked with `isMe` and everyone else is a name and a score.
 */
export function buildPodcastLeaderboard({
  listeners,
  viewerId,
  todayKey,
}: {
  listeners: readonly PodcastLeaderboardListener[];
  viewerId: string;
  todayKey: string;
}): PodcastLeaderboardData {
  const scored = listeners.map((listener) => {
    const streaks = computeStreaks(listener.activityDays, todayKey);
    const breakdown = scorePodcastListener(listener, streaks.longest);
    return {
      userId: listener.userId,
      name: listener.name,
      points: breakdown.total,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      breakdown,
    };
  });

  const ranked = rankByPoints(scored);
  const mine = ranked.find((row) => row.userId === viewerId);

  return {
    monthLabel: podcastLeaderboardMonthLabel(todayKey),
    top: ranked.slice(0, LEADERBOARD_MAX_LISTED).map((row) => ({
      rank: row.rank,
      name: row.name,
      points: row.points,
      currentStreak: row.currentStreak,
      isMe: row.userId === viewerId,
    })),
    total: ranked.length,
    me: mine
      ? {
          rank: mine.rank,
          points: mine.points,
          currentStreak: mine.currentStreak,
          longestStreak: mine.longestStreak,
          breakdown: mine.breakdown,
        }
      : null,
  };
}
