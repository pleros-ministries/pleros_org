import { describe, expect, test } from "vitest";

import { canAccessSogpDay } from "./day-access";

describe("canAccessSogpDay", () => {
  test("immediate start admits preparing learners to published teaching before cohort release", () => {
    expect(canAccessSogpDay({ learnerState:"preparing",now:new Date("2026-10-14"),releaseAt:new Date("2026-11-01"),curriculumLevel:1,previousLevelComplete:false,immediateStart:true,lessonStatus:"published" })).toBe(true);
  });
  test("immediate start does not expose drafts or admit withdrawn learners", () => {
    const input = { learnerState:"preparing" as const,now:new Date("2026-10-14"),releaseAt:new Date("2026-10-01"),curriculumLevel:1 as const,previousLevelComplete:false,immediateStart:true };
    expect(canAccessSogpDay({ ...input,lessonStatus:"draft" })).toBe(false);
    expect(canAccessSogpDay({ ...input,learnerState:"withdrawn",lessonStatus:"published" })).toBe(false);
  });
  test("allows released days and blocks future days", () => {
    expect(
      canAccessSogpDay({
        learnerState: "active",
        now: new Date("2026-09-15T12:00:00Z"),
        releaseAt: new Date("2026-09-15T00:00:00Z"),
        curriculumLevel: 1,
        previousLevelComplete: true,
      }),
    ).toBe(true);
    expect(
      canAccessSogpDay({
        learnerState: "active",
        now: new Date("2026-09-15T12:00:00Z"),
        releaseAt: new Date("2026-09-16T00:00:00Z"),
        curriculumLevel: 1,
        previousLevelComplete: true,
      }),
    ).toBe(false);
  });

  test("keeps released days available during carryover", () => {
    expect(
      canAccessSogpDay({
        learnerState: "carryover",
        now: new Date("2026-10-17T00:00:00Z"),
        releaseAt: new Date("2026-09-08T00:00:00Z"),
        curriculumLevel: 3,
        previousLevelComplete: true,
      }),
    ).toBe(true);
  });

  test("allows a released track even if the previous level isn't complete", () => {
    expect(
      canAccessSogpDay({
        learnerState: "active",
        now: new Date("2026-09-27T00:00:00Z"),
        releaseAt: new Date("2026-09-21T00:00:00Z"),
        curriculumLevel: 2,
        previousLevelComplete: false,
      }),
    ).toBe(true);
  });

  test("still blocks withdrawn learners from a released track", () => {
    expect(
      canAccessSogpDay({
        learnerState: "withdrawn",
        now: new Date("2026-09-27T00:00:00Z"),
        releaseAt: new Date("2026-09-21T00:00:00Z"),
        curriculumLevel: 2,
        previousLevelComplete: true,
      }),
    ).toBe(false);
  });
});
