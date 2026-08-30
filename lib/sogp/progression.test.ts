import { describe, expect, test } from "vitest";

import { canAccessSogpTrack, summarizeSogpLevels } from "./progression";

const startsAt = new Date("2026-09-07T06:00:00+01:00");

function tracks(completedByLevel: number[]) {
  return Array.from({ length: 24 }, (_, index) => {
    const curriculumLevel = Math.floor(index / 6) + 1;
    return {
      curriculumLevel,
      assessmentComplete: index % 6 < (completedByLevel[curriculumLevel - 1] ?? 0),
    };
  });
}

describe("summarizeSogpLevels", () => {
  test("opens level one at cohort start and locks later levels", () => {
    const levels = summarizeSogpLevels({
      tracks: tracks([0, 0, 0, 0]),
      startsAt,
      now: startsAt,
    });

    expect(levels.map((level) => level.status)).toEqual([
      "available",
      "locked",
      "locked",
      "locked",
    ]);
  });

  test("keeps a completed next level locked until its calendar week", () => {
    const levels = summarizeSogpLevels({
      tracks: tracks([6, 0, 0, 0]),
      startsAt,
      now: new Date("2026-09-12T12:00:00+01:00"),
    });

    expect(levels[0]?.status).toBe("complete");
    expect(levels[1]?.status).toBe("locked");
  });

  test("shows assessment progress in the currently unlocked level", () => {
    const levels = summarizeSogpLevels({
      tracks: tracks([6, 2, 0, 0]),
      startsAt,
      now: new Date("2026-09-16T12:00:00+01:00"),
    });

    expect(levels[1]).toMatchObject({
      status: "in_progress",
      completed: 2,
      total: 6,
    });
  });

  test("only opens the earliest incomplete eligible level", () => {
    const levels = summarizeSogpLevels({
      tracks: tracks([6, 6, 0, 0]),
      startsAt,
      now: new Date("2026-10-01T12:00:00+01:00"),
    });

    expect(levels.map((level) => level.status)).toEqual([
      "complete",
      "complete",
      "available",
      "locked",
    ]);
  });
});

describe("canAccessSogpTrack", () => {
  test("combines release date and prior-level completion", () => {
    const released = new Date("2026-09-14T06:00:00+01:00");
    const now = new Date("2026-09-14T12:00:00+01:00");

    expect(
      canAccessSogpTrack({
        releaseAt: released,
        curriculumLevel: 2,
        previousLevelComplete: true,
        now,
      }),
    ).toBe(true);
    expect(
      canAccessSogpTrack({
        releaseAt: released,
        curriculumLevel: 2,
        previousLevelComplete: false,
        now,
      }),
    ).toBe(false);
  });
});
