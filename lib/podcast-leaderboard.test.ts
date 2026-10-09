import { expect, test } from "vitest";

import {
  buildPodcastLeaderboard,
  PODCAST_LEADERBOARD_POINTS,
  podcastLeaderboardMonthLabel,
  scorePodcastListener,
  type PodcastLeaderboardListener,
} from "./podcast-leaderboard";

function listener(
  overrides: Partial<PodcastLeaderboardListener> & Pick<PodcastLeaderboardListener, "userId" | "name">,
): PodcastLeaderboardListener {
  return {
    listeningDays: 1,
    prayerWatch: 0,
    activityDays: [],
    visible: true,
    ...overrides,
  };
}

test("scores listening days, Prayer Watch and a streak bonus every seven days", () => {
  expect(scorePodcastListener({ listeningDays: 0, prayerWatch: 0 }, 0).total).toBe(0);

  const breakdown = scorePodcastListener({ listeningDays: 4, prayerWatch: 3 }, 15);
  expect(breakdown).toEqual({
    listening: 4 * PODCAST_LEADERBOARD_POINTS.listeningDay,
    prayer: 3 * PODCAST_LEADERBOARD_POINTS.prayerWatch,
    streak: 2 * PODCAST_LEADERBOARD_POINTS.streakMilestone,
    total:
      4 * PODCAST_LEADERBOARD_POINTS.listeningDay +
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
    viewerVisible: true,
    todayKey: "2026-10-05",
    listeners: [
      listener({
        userId: "user-a",
        name: "Ada",
        listeningDays: 3,
        activityDays: ["2026-10-01", "2026-10-02", "2026-10-03"],
      }),
      listener({
        userId: "user-b",
        name: "Bola",
        listeningDays: 1,
        prayerWatch: 5,
        activityDays: ["2026-10-04", "2026-10-05"],
      }),
      listener({
        userId: "user-c",
        name: "Chidi",
        listeningDays: 1,
        activityDays: ["2026-10-05"],
      }),
    ],
  });

  expect(data.monthLabel).toBe("October 2026");
  expect(data.total).toBe(3);
  expect(data.viewerVisible).toBe(true);
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
    breakdown: { listening: 5, prayer: 10, streak: 0, total: 15 },
    visible: true,
  });
});

test("leaves hidden listeners off the board and gives a hidden viewer a private rank", () => {
  const data = buildPodcastLeaderboard({
    viewerId: "user-viewer",
    viewerVisible: false,
    todayKey: "2026-10-05",
    listeners: [
      listener({ userId: "user-a", name: "Ada", listeningDays: 4 }),
      listener({ userId: "user-hidden", name: "Hidden", listeningDays: 9, visible: false }),
      listener({ userId: "user-c", name: "Chidi", listeningDays: 1 }),
      listener({ userId: "user-viewer", name: "Viewer", listeningDays: 2 }),
    ],
  });

  expect(data.total).toBe(2);
  expect(data.top.map((entry) => entry.name)).toEqual(["Ada", "Chidi"]);
  expect(data.me).toMatchObject({ rank: 2, points: 10, visible: false });
  expect(data.viewerVisible).toBe(false);
});

test("needs at least one listening day to score", () => {
  const data = buildPodcastLeaderboard({
    viewerId: "user-viewer",
    viewerVisible: true,
    todayKey: "2026-10-05",
    listeners: [
      listener({
        userId: "user-viewer",
        name: "Viewer",
        listeningDays: 0,
        prayerWatch: 4,
      }),
    ],
  });

  expect(data.top).toEqual([]);
  expect(data.me).toBeNull();
});

test("never puts a user id in the leaderboard payload", () => {
  const data = buildPodcastLeaderboard({
    viewerId: "user-viewer",
    viewerVisible: false,
    todayKey: "2026-10-05",
    listeners: [listener({ userId: "user-secret", name: "Ada" })],
  });

  expect(JSON.stringify(data)).not.toContain("user-secret");
  expect(data.me).toBeNull();
});
