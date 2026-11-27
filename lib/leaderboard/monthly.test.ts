import { describe, expect, test } from "vitest";

import {
  buildMonthlyLeaderboard,
  denseRankFor,
  EMPTY_MONTHLY_COUNTS,
  MONTHLY_MAX_LISTED,
  MONTHLY_POINTS,
  monthWindow,
  placeViewer,
  rankByPoints,
  scoreMonth,
  type MonthlyCounts,
  type MonthlyPerson,
} from "./monthly";

const month = monthWindow("2026-11-25");
const counts = (partial: Partial<MonthlyCounts>): MonthlyCounts => ({ ...EMPTY_MONTHLY_COUNTS, ...partial });
const person = (userId: string, firstName: string, partial: Partial<MonthlyCounts>, extra: Partial<MonthlyPerson> = {}): MonthlyPerson =>
  ({ userId, firstName, alias: null, hidden: false, counts: counts(partial), ...extra });
const viewer = { firstName: "Sam", alias: null, hidden: false };

describe("monthWindow", () => {
  test("names the month and counts days so far and left, today included", () => {
    expect(month).toMatchObject({ key: "2026-11", startKey: "2026-11-01", label: "November 2026", name: "November", daysInMonth: 30, daysSoFar: 25, daysLeft: 6 });
  });

  test("handles the first and last day, and February in a leap year", () => {
    expect(monthWindow("2026-12-01")).toMatchObject({ key: "2026-12", daysSoFar: 1, daysLeft: 31, label: "December 2026" });
    expect(monthWindow("2026-12-31")).toMatchObject({ daysSoFar: 31, daysLeft: 1 });
    expect(monthWindow("2028-02-29")).toMatchObject({ daysInMonth: 29, daysLeft: 1 });
  });
});

describe("scoreMonth", () => {
  test("scores each part and totals them", () => {
    const breakdown = scoreMonth({ learningDays: 18, prayerSessions: 23, bibleDays: 10, invitations: 1 });
    expect(breakdown).toEqual({
      learning: 18 * MONTHLY_POINTS.learningDay,
      prayer: 23 * MONTHLY_POINTS.prayerSession,
      bible: 10 * MONTHLY_POINTS.bibleDay,
      invitations: MONTHLY_POINTS.invitation,
      total: 90 + 46 + 30 + 10,
    });
  });

  test("scores nothing for an empty month", () => {
    expect(scoreMonth(EMPTY_MONTHLY_COUNTS).total).toBe(0);
  });
});

describe("ranking", () => {
  test("equal points share a rank and the next rank follows on", () => {
    const ranked = rankByPoints([{ name: "Kemi", points: 151 }, { name: "Ada", points: 214 }, { name: "Chidi", points: 151 }, { name: "Femi", points: 51 }]);
    expect(ranked.map(row => [row.name, row.rank])).toEqual([["Ada", 1], ["Chidi", 2], ["Kemi", 2], ["Femi", 3]]);
  });

  test("gives the rank a score would hold among others", () => {
    expect(denseRankFor(151, [214, 151, 151, 51])).toBe(2);
    expect(denseRankFor(10, [])).toBe(1);
  });
});

describe("buildMonthlyLeaderboard", () => {
  test("lists everyone with points, best first, named by first name or leaderboard name, without ids", () => {
    const data = buildMonthlyLeaderboard({
      month,
      viewerId: "u-sam",
      viewer,
      people: [
        person("u-ada", "Ada", { learningDays: 10 }),
        person("u-sam", "Sam", { bibleDays: 2 }),
        person("u-tolu", "Tolu", { prayerSessions: 4 }, { alias: "Morning Star" }),
        person("u-none", "Bisi", {}),
      ],
    });
    expect(data.top).toEqual([
      { rank: 1, name: "Ada", points: 50, isMe: false },
      { rank: 2, name: "Morning Star", points: 8, isMe: false },
      { rank: 3, name: "Sam", points: 6, isMe: true },
    ]);
    expect(data.total).toBe(3);
    expect(data.me).toMatchObject({ rank: 3, points: 6, hidden: false, firstName: "Sam" });
    expect(JSON.stringify(data)).not.toContain("u-");
  });

  test("keeps hidden people off the board and gives a hidden viewer a private rank", () => {
    const data = buildMonthlyLeaderboard({
      month,
      viewerId: "u-sam",
      viewer,
      people: [
        person("u-ada", "Ada", { learningDays: 10 }),
        person("u-kemi", "Kemi", { learningDays: 20 }, { hidden: true }),
        person("u-sam", "Sam", { learningDays: 5 }, { hidden: true }),
        person("u-tolu", "Tolu", { learningDays: 1 }),
      ],
    });
    expect(data.top.map(row => row.name)).toEqual(["Ada", "Tolu"]);
    expect(data.total).toBe(2);
    expect(data.me).toMatchObject({ rank: 2, points: 25, hidden: true });
  });

  test("a viewer with nothing yet has no rank and keeps their saved name", () => {
    const data = buildMonthlyLeaderboard({ month: monthWindow("2026-12-01"), viewerId: "u-sam", viewer: { firstName: "Sam", alias: "Samwise", hidden: false }, people: [] });
    expect(data.top).toEqual([]);
    expect(data.total).toBe(0);
    expect(data.me).toMatchObject({ rank: null, points: 0, alias: "Samwise", counts: EMPTY_MONTHLY_COUNTS });
  });

  test("lists at most the top hundred but counts everyone", () => {
    const people = Array.from({ length: MONTHLY_MAX_LISTED + 20 }, (_, index) => person(`u-${index}`, `P${index}`, { learningDays: 200 - index }));
    const data = buildMonthlyLeaderboard({ month, viewerId: "u-110", viewer, people });
    expect(data.top).toHaveLength(MONTHLY_MAX_LISTED);
    expect(data.total).toBe(MONTHLY_MAX_LISTED + 20);
    expect(data.me.rank).toBe(111);
  });
});

describe("placeViewer", () => {
  const data = buildMonthlyLeaderboard({
    month,
    viewerId: "u-sam",
    viewer,
    people: [person("u-ada", "Ada", { learningDays: 10 }), person("u-sam", "Sam", { learningDays: 4 }), person("u-tolu", "Tolu", { learningDays: 2 })],
  });

  test("hiding takes your row off and closes the board up, keeping your rank private", () => {
    const board = placeViewer(data, { hidden: true, name: "Sam" });
    expect(board.rows.map(row => [row.name, row.rank])).toEqual([["Ada", 1], ["Tolu", 2]]);
    expect(board.myRank).toBe(2);
    expect(board.total).toBe(2);
  });

  test("a new leaderboard name shows on your row at once", () => {
    const board = placeViewer(data, { hidden: false, name: "Samwise" });
    expect(board.rows.find(row => row.isMe)).toMatchObject({ name: "Samwise", rank: 2 });
    expect(board.total).toBe(3);
  });

  test("further down than the board lists, your row follows at your real rank", () => {
    const people = Array.from({ length: MONTHLY_MAX_LISTED + 20 }, (_, index) => person(`u-${index}`, `P${index}`, { learningDays: 200 - index }));
    const big = buildMonthlyLeaderboard({ month, viewerId: "u-110", viewer, people });
    const board = placeViewer(big, { hidden: false, name: "P110" });
    expect(board.rows).toHaveLength(MONTHLY_MAX_LISTED);
    expect(board.outside).toMatchObject({ rank: 111, isMe: true });
    expect(board.myRank).toBe(111);
  });
});
