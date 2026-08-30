import { describe, expect, test } from "vitest";

import { canAccessSogpDay } from "./day-access";

describe("canAccessSogpDay", () => {
  test("allows released days and blocks future days", () => {
    expect(
      canAccessSogpDay({
        learnerState: "active",
        now: new Date("2026-09-08T12:00:00Z"),
        releaseAt: new Date("2026-09-08T00:00:00Z"),
        curriculumLevel: 1,
        previousLevelComplete: true,
      }),
    ).toBe(true);
    expect(
      canAccessSogpDay({
        learnerState: "active",
        now: new Date("2026-09-08T12:00:00Z"),
        releaseAt: new Date("2026-09-09T00:00:00Z"),
        curriculumLevel: 1,
        previousLevelComplete: true,
      }),
    ).toBe(false);
  });

  test("keeps released days available during carryover", () => {
    expect(
      canAccessSogpDay({
        learnerState: "carryover",
        now: new Date("2026-10-10T00:00:00Z"),
        releaseAt: new Date("2026-09-01T00:00:00Z"),
        curriculumLevel: 3,
        previousLevelComplete: true,
      }),
    ).toBe(true);
  });

  test("blocks a released track until the previous level is complete", () => {
    expect(
      canAccessSogpDay({
        learnerState: "active",
        now: new Date("2026-09-20T00:00:00Z"),
        releaseAt: new Date("2026-09-14T00:00:00Z"),
        curriculumLevel: 2,
        previousLevelComplete: false,
      }),
    ).toBe(false);
  });
});
