import { expect, test } from "vitest";

import {
  buildPodcastLeaderboard,
  PODCAST_LEADERBOARD_POINTS,
  podcastLeaderboardMonthLabel,
  scorePodcastListener,
} from "./podcast-leaderboard";

test("scores episodes, Prayer Watch and a streak bonus every seven days", () => {
  expect(scorePodcastListener({ episodes: 0, prayerWatch: 0 }, 0).total).toBe(0);

  const breakdown = scorePodcastListener({ episodes: 4, prayerWatch: 3 }, 15);
  expect(breakdown).toEqual({
    episodes: 4 * PODCAST_LEADERBOARD_POINTS.episode,
    prayer: 3 * PODCAST_LEADERBOARD_POINTS.prayerWatch,
    streak: 2 * PODCAST_LEADERBOARD_POINTS.streakMilestone,
    total:
      4 * PODCAST_LEADERBOARD_POINTS.episode +
      3 * PODCAST_LEADERBOARD_POINTS.prayerWatch +
      2 * PODCAST_LEADERBOARD_POINTS.streakMilestone,
  });
});

test("labels the board with the Lagos month being scored", () => {
  expect(podcastLeaderboardMonthLabel("2026-10-05")).toBe("October 2026");
});

test("ranks listeners, shares a rank on a tie and marks the viewer", () => {
  const data = buildPodcastLeaderboard({
    viewerId: "user-b",
    todayKey: "2026-10-05",
    listeners: [
      {
        userId: "user-a",
        name: "Ada",
        episodes: 3,
        prayerWatch: 0,
        activityDays: ["2026-10-01", "2026-10-02", "2026-10-03"],
      },
      {
        userId: "user-b",
        name: "Bola",
        episodes: 1,
        prayerWatch: 5,
        activityDays: ["2026-10-04", "2026-10-05"],
      },
      {
        userId: "user-c",
        name: "Chidi",
        episodes: 1,
        prayerWatch: 0,
        activityDays: ["2026-10-05"],
      },
    ],
  });

  expect(data.monthLabel).toBe("October 2026");
  expect(data.total).toBe(3);
  expect(data.top).toEqual([
    { rank: 1, name: "Ada", points: 15, currentStreak: 0, isMe: false },
    { rank: 1, name: "Bola", points: 15, currentStreak: 2, isMe: true },
    { rank: 2, name: "Chidi", points: 5, currentStreak: 1, isMe: false },
  ]);
  expect(data.me).toEqual({
    rank: 1,
    points: 15,
    currentStreak: 2,
    longestStreak: 2,
    breakdown: { episodes: 5, prayer: 10, streak: 0, total: 15 },
  });
});

test("never puts a user id in the leaderboard payload", () => {
  const data = buildPodcastLeaderboard({
    viewerId: "user-viewer",
    todayKey: "2026-10-05",
    listeners: [
      {
        userId: "user-secret",
        name: "Ada",
        episodes: 1,
        prayerWatch: 0,
        activityDays: [],
      },
    ],
  });

  expect(JSON.stringify(data)).not.toContain("user-secret");
  expect(data.me).toBeNull();
});
