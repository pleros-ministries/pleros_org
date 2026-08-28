import { describe, expect, test } from "vitest";

import {
  buildPreparationDateKeys,
  deriveSogpCalendarState,
  getSogpCountdown,
} from "./calendar";

describe("buildPreparationDateKeys", () => {
  test("builds 30 consecutive Lagos dates ending the day before SOGP", () => {
    const dates = buildPreparationDateKeys(
      new Date("2026-11-01T00:00:00+01:00"),
    );

    expect(dates).toHaveLength(30);
    expect(dates[0]).toBe("2026-10-02");
    expect(dates.at(-1)).toBe("2026-10-31");
  });
});

describe("deriveSogpCalendarState", () => {
  test("keeps future and incomplete-today dates neutral", () => {
    expect(
      deriveSogpCalendarState({
        dateKey: "2026-10-12",
        todayKey: "2026-10-11",
        requirements: [false, false],
      }),
    ).toBe("future");
    expect(
      deriveSogpCalendarState({
        dateKey: "2026-10-11",
        todayKey: "2026-10-11",
        requirements: [true, false],
      }),
    ).toBe("current");
  });

  test("marks incomplete past dates missed and fully complete dates complete", () => {
    expect(
      deriveSogpCalendarState({
        dateKey: "2026-10-10",
        todayKey: "2026-10-11",
        requirements: [false, true],
      }),
    ).toBe("missed");
    expect(
      deriveSogpCalendarState({
        dateKey: "2026-10-10",
        todayKey: "2026-10-11",
        requirements: [true, true],
      }),
    ).toBe("complete");
  });
});

describe("getSogpCountdown", () => {
  test("uses Lagos calendar days and switches to active at the start", () => {
    const startsAt = new Date("2026-11-01T00:00:00+01:00");

    expect(
      getSogpCountdown(startsAt, new Date("2026-10-29T12:00:00+01:00")),
    ).toEqual({ days: 3, label: "3 days until SOGP begins", phase: "upcoming" });
    expect(getSogpCountdown(startsAt, startsAt)).toEqual({
      days: 0,
      label: "SOGP is active",
      phase: "active",
    });
  });
});
