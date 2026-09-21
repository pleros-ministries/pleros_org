import { expect, test } from "vitest";

import {
  computeStreaks,
  denseRankFor,
  EMPTY_ACTIVITY_COUNTS,
  LEADERBOARD_POINTS,
  LEADERBOARD_SHARE_CAP,
  rankByPoints,
  scoreParticipant,
} from "./leaderboard-scoring";

test("scores zero for a participant with no activity", () => {
  expect(scoreParticipant(EMPTY_ACTIVITY_COUNTS, 0).total).toBe(0);
});

test("adds category points and totals them", () => {
  const breakdown = scoreParticipant(
    {
      ...EMPTY_ACTIVITY_COUNTS,
      quizPassed: 2,
      writtenApproved: 1,
      daysCompleted: 2,
      prayerWatch: 3,
      reviews: 1,
      preparationDays: 4,
      shares: 2,
      referrals: 1,
    },
    0,
  );

  expect(breakdown.course).toBe(2 * 10 + 10 + 2 * 5);
  expect(breakdown.attendance).toBe(3 * 2 + 15 + 4 * 3);
  expect(breakdown.sharing).toBe(2 * 5 + 20);
  expect(breakdown.streak).toBe(0);
  expect(breakdown.total).toBe(
    breakdown.course + breakdown.attendance + breakdown.sharing,
  );
});

test("caps counted shares so repeat sharing cannot run away", () => {
  const breakdown = scoreParticipant(
    { ...EMPTY_ACTIVITY_COUNTS, shares: 500 },
    0,
  );
  expect(breakdown.sharing).toBe(LEADERBOARD_SHARE_CAP * LEADERBOARD_POINTS.share);
});

test("awards one streak bonus per full seven-day milestone", () => {
  expect(scoreParticipant(EMPTY_ACTIVITY_COUNTS, 6).streak).toBe(0);
  expect(scoreParticipant(EMPTY_ACTIVITY_COUNTS, 7).streak).toBe(
    LEADERBOARD_POINTS.streakMilestone,
  );
  expect(scoreParticipant(EMPTY_ACTIVITY_COUNTS, 15).streak).toBe(
    2 * LEADERBOARD_POINTS.streakMilestone,
  );
});

test("finds the longest run across gaps and ignores duplicate days", () => {
  const streaks = computeStreaks(
    [
      "2026-09-01",
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-06",
      "2026-09-07",
    ],
    "2026-09-20",
  );
  expect(streaks.longest).toBe(3);
  expect(streaks.current).toBe(0);
});

test("keeps the current streak alive when today has no activity yet", () => {
  const streaks = computeStreaks(
    ["2026-09-18", "2026-09-19"],
    "2026-09-20",
  );
  expect(streaks).toEqual({ longest: 2, current: 2 });
});

test("counts a streak that includes today", () => {
  expect(
    computeStreaks(["2026-09-19", "2026-09-20"], "2026-09-20").current,
  ).toBe(2);
});

test("breaks the current streak after a missed day", () => {
  expect(computeStreaks(["2026-09-17", "2026-09-18"], "2026-09-20")).toEqual({
    longest: 2,
    current: 0,
  });
});

test("streaks bridge month boundaries", () => {
  expect(
    computeStreaks(["2026-08-30", "2026-08-31", "2026-09-01"], "2026-09-01")
      .longest,
  ).toBe(3);
});

test("returns zero streaks with no activity", () => {
  expect(computeStreaks([], "2026-09-20")).toEqual({ longest: 0, current: 0 });
});

test("ranks with ties sharing a rank and ordering by name", () => {
  const ranked = rankByPoints([
    { name: "Zainab", points: 50 },
    { name: "Adaeze", points: 80 },
    { name: "Bolu", points: 50 },
    { name: "Chidi", points: 10 },
  ]);

  expect(ranked.map((row) => [row.name, row.rank])).toEqual([
    ["Adaeze", 1],
    ["Bolu", 2],
    ["Zainab", 2],
    ["Chidi", 3],
  ]);
});

test("places a hidden participant among the visible scores", () => {
  const visible = [80, 50, 50, 10];
  expect(denseRankFor(90, visible)).toBe(1);
  expect(denseRankFor(50, visible)).toBe(2);
  expect(denseRankFor(30, visible)).toBe(3);
  expect(denseRankFor(0, visible)).toBe(4);
});
