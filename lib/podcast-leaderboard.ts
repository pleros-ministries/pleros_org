import {
  computeStreaks,
  denseRankFor,
  LEADERBOARD_MAX_LISTED,
  LEADERBOARD_POINTS,
  LEADERBOARD_STREAK_MILESTONE_DAYS,
  rankByPoints,
} from "./sogp/leaderboard-scoring";

export const PODCAST_LEADERBOARD_POINTS = {
  listeningDay: 5,
  prayerWatch: LEADERBOARD_POINTS.prayerWatch,
  streakMilestone: LEADERBOARD_POINTS.streakMilestone,
} as const;

export type PodcastLeaderboardBreakdown = {
  listening: number;
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
  /** On the board, or the rank they would hold while their points are private. */
  rank: number;
  points: number;
  currentStreak: number;
  longestStreak: number;
  breakdown: PodcastLeaderboardBreakdown;
  visible: boolean;
};

export type PodcastLeaderboardData = {
  monthLabel: string;
  top: PodcastLeaderboardEntry[];
  total: number;
  me: PodcastLeaderboardMe | null;
  /** Whether the viewer has chosen to appear on the board. */
  viewerVisible: boolean;
};

/** What the scorer needs for one listener; `name` is already the public name. */
export type PodcastLeaderboardListener = {
  userId: string;
  name: string;
  /** Lagos days this month with at least one episode marked as listened. */
  listeningDays: number;
  prayerWatch: number;
  activityDays: Iterable<string>;
  /** Chose to appear on the board. */
  visible: boolean;
};

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function podcastLeaderboardMonthLabel(todayKey: string) {
  return monthFormatter.format(new Date(`${todayKey.slice(0, 7)}-01T00:00:00.000Z`));
}

/**
 * Listening scores once per day, whichever journey the listener follows, so
 * marking a whole series at once earns a single day's points.
 */
export function scorePodcastListener(
  counts: { listeningDays: number; prayerWatch: number },
  longestStreak: number,
): PodcastLeaderboardBreakdown {
  const listening = counts.listeningDays * PODCAST_LEADERBOARD_POINTS.listeningDay;
  const prayer = counts.prayerWatch * PODCAST_LEADERBOARD_POINTS.prayerWatch;
  const streak =
    Math.floor(longestStreak / LEADERBOARD_STREAK_MILESTONE_DAYS) *
    PODCAST_LEADERBOARD_POINTS.streakMilestone;

  return { listening, prayer, streak, total: listening + prayer + streak };
}

/**
 * Ranks this month's listeners who chose to appear. The viewer always sees
 * their own score, with a private rank while they are hidden. The result
 * carries no user ids: the viewer is marked with `isMe` and everyone else is
 * a name and a score.
 */
export function buildPodcastLeaderboard({
  listeners,
  viewerId,
  viewerVisible,
  todayKey,
}: {
  listeners: readonly PodcastLeaderboardListener[];
  viewerId: string;
  viewerVisible: boolean;
  todayKey: string;
}): PodcastLeaderboardData {
  const scored = listeners
    .filter((listener) => listener.listeningDays > 0)
    .map((listener) => {
      const streaks = computeStreaks(listener.activityDays, todayKey);
      const breakdown = scorePodcastListener(listener, streaks.longest);
      return {
        userId: listener.userId,
        name: listener.name,
        visible:
          listener.userId === viewerId ? viewerVisible : listener.visible,
        points: breakdown.total,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        breakdown,
      };
    });

  const ranked = rankByPoints(scored.filter((row) => row.visible));
  const mine = scored.find((row) => row.userId === viewerId);
  const myRank = mine
    ? mine.visible
      ? ranked.find((row) => row.userId === viewerId)!.rank
      : denseRankFor(
          mine.points,
          ranked.map((row) => row.points),
        )
    : null;

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
    me:
      mine && myRank !== null
        ? {
            rank: myRank,
            points: mine.points,
            currentStreak: mine.currentStreak,
            longestStreak: mine.longestStreak,
            breakdown: mine.breakdown,
            visible: mine.visible,
          }
        : null,
    viewerVisible,
  };
}
