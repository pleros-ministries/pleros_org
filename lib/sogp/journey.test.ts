import { describe, expect, test } from "vitest";

import {
  getPreparationRequirements,
  getSogpDayRequirements,
} from "./journey";

describe("SOGP journey requirements", () => {
  test("requires the lesson and Prayer Watch during preparation", () => {
    expect(
      getPreparationRequirements({
        lessonComplete: true,
        prayerWatchComplete: false,
      }),
    ).toEqual([true, false]);
  });

  test("requires Prayer Watch and assessment on weekdays", () => {
    expect(
      getSogpDayRequirements({
        kind: "weekday",
        prayerWatchComplete: true,
        assessmentComplete: false,
      }),
    ).toEqual([true, false]);
  });

  test("requires only Prayer Watch on an ordinary weekend date", () => {
    expect(
      getSogpDayRequirements({
        kind: "weekend",
        prayerWatchComplete: true,
      }),
    ).toEqual([true]);
  });

  test("requires Prayer Watch and the review on a scheduled review date", () => {
    expect(
      getSogpDayRequirements({
        kind: "review",
        prayerWatchComplete: true,
        reviewComplete: false,
      }),
    ).toEqual([true, false]);
  });
});
