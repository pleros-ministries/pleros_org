import { describe, expect, test } from "vitest";

import {
  convertClock,
  daysBetween,
  formatClock,
  getZonedMinutesSinceMidnight,
  getZonedParts,
  isDue,
  isValidTimeZone,
  mondayOf,
  shiftDateKey,
  weekdayOf,
  zonedTimeToUtc,
} from "./zoned-time";

const iso = (date: Date) => date.toISOString();

describe("time zone validation", () => {
  test("accepts IANA zones and rejects anything else", () => {
    expect(isValidTimeZone("Africa/Lagos")).toBe(true);
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("Mars/Olympus")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone("   ")).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
    expect(isValidTimeZone(60)).toBe(false);
  });
});

describe("reading an instant in a zone", () => {
  test("gives the Lagos date, minutes and weekday", () => {
    // 05:30 UTC is 6:30 am in Lagos (UTC+1, no daylight saving).
    expect(getZonedParts(new Date("2026-10-12T05:30:00Z"), "Africa/Lagos")).toEqual({
      dateKey: "2026-10-12",
      minutes: 390,
      weekday: 1,
    });
  });

  test("reads midnight as minute 0 of the new day, never 24:00", () => {
    // 23:00 UTC on the 11th is exactly midnight on the 12th in Lagos.
    expect(getZonedParts(new Date("2026-10-11T23:00:00Z"), "Africa/Lagos")).toEqual({
      dateKey: "2026-10-12",
      minutes: 0,
      weekday: 1,
    });
    expect(
      getZonedMinutesSinceMidnight(new Date("2026-10-11T23:00:00Z"), "Africa/Lagos"),
    ).toBe(0);
  });

  test("follows the learner's calendar when it differs from Lagos", () => {
    const instant = new Date("2026-10-13T02:00:00Z");
    // Monday evening in Los Angeles is already Tuesday in Lagos.
    expect(getZonedParts(instant, "America/Los_Angeles")).toEqual({
      dateKey: "2026-10-12",
      minutes: 19 * 60,
      weekday: 1,
    });
    expect(getZonedParts(instant, "Africa/Lagos").dateKey).toBe("2026-10-13");
  });
});

describe("turning a wall-clock time into an instant", () => {
  test("handles fixed offsets, including a half-hour one", () => {
    expect(iso(zonedTimeToUtc("2026-10-12", 390, "Africa/Lagos"))).toBe(
      "2026-10-12T05:30:00.000Z",
    );
    // India is UTC+5:30, so 6:00 am is 00:30 UTC.
    expect(iso(zonedTimeToUtc("2026-10-12", 360, "Asia/Kolkata"))).toBe(
      "2026-10-12T00:30:00.000Z",
    );
  });

  test("uses the offset in force on that date", () => {
    // New York is UTC-5 in January and UTC-4 in July.
    expect(iso(zonedTimeToUtc("2026-01-15", 9 * 60, "America/New_York"))).toBe(
      "2026-01-15T14:00:00.000Z",
    );
    expect(iso(zonedTimeToUtc("2026-07-15", 9 * 60, "America/New_York"))).toBe(
      "2026-07-15T13:00:00.000Z",
    );
    // Auckland is on daylight time (UTC+13) in October.
    expect(iso(zonedTimeToUtc("2026-10-12", 8 * 60, "Pacific/Auckland"))).toBe(
      "2026-10-11T19:00:00.000Z",
    );
  });

  test("resolves a time skipped by clocks going forward to just before the change", () => {
    // On 8 March 2026 New York jumps from 1:59 am to 3:00 am, so 2:30 am never
    // happens. It resolves to 06:30 UTC, which reads 1:30 am, one hour before
    // the gap.
    const instant = zonedTimeToUtc("2026-03-08", 150, "America/New_York");
    expect(iso(instant)).toBe("2026-03-08T06:30:00.000Z");
    expect(getZonedParts(instant, "America/New_York").minutes).toBe(90);
  });

  test("resolves a repeated time to its first occurrence", () => {
    // On 1 November 2026 New York has 1:30 am twice (05:30 and 06:30 UTC).
    expect(iso(zonedTimeToUtc("2026-11-01", 90, "America/New_York"))).toBe(
      "2026-11-01T05:30:00.000Z",
    );
  });

  test("round-trips through getZonedParts", () => {
    const cases: Array<[string, number, string]> = [
      ["2026-10-12", 0, "Africa/Lagos"],
      ["2026-10-12", 23 * 60 + 50, "Africa/Lagos"],
      ["2026-06-01", 7 * 60 + 15, "Europe/London"],
      ["2026-12-01", 7 * 60 + 15, "Europe/London"],
      ["2026-10-12", 19 * 60, "America/Los_Angeles"],
      ["2026-10-12", 6 * 60, "Asia/Tokyo"],
      ["2026-10-12", 6 * 60, "Pacific/Auckland"],
    ];
    for (const [dateKey, minutes, timeZone] of cases) {
      const parts = getZonedParts(zonedTimeToUtc(dateKey, minutes, timeZone), timeZone);
      expect(parts.dateKey).toBe(dateKey);
      expect(parts.minutes).toBe(minutes);
    }
  });
});

describe("due windows", () => {
  const due = new Date("2026-10-12T04:20:00Z");
  const tenMinutes = 10 * 60_000;

  test("opens at the due instant and closes after the window", () => {
    expect(isDue(due, new Date("2026-10-12T04:19:59Z"), tenMinutes)).toBe(false);
    expect(isDue(due, new Date("2026-10-12T04:20:00Z"), tenMinutes)).toBe(true);
    expect(isDue(due, new Date("2026-10-12T04:29:59Z"), tenMinutes)).toBe(true);
    expect(isDue(due, new Date("2026-10-12T04:30:00Z"), tenMinutes)).toBe(false);
  });
});

describe("clock formatting and conversion", () => {
  test("formats minutes the way Prayer Watch times are written", () => {
    expect(formatClock(0)).toBe("12:00 am");
    expect(formatClock(390)).toBe("6:30 am");
    expect(formatClock(720)).toBe("12:00 pm");
    expect(formatClock(1230)).toBe("8:30 pm");
    expect(formatClock(1439)).toBe("11:59 pm");
  });

  test("converts a Lagos time into another zone with the day it lands on", () => {
    // 8:30 pm Lagos is 9:30 am the same day in Honolulu…
    expect(
      convertClock(20 * 60 + 30, "Africa/Lagos", "Pacific/Honolulu", "2026-10-12"),
    ).toEqual({ minutes: 9 * 60 + 30, dayShift: 0 });
    // …and 8:30 am the next day in Auckland.
    expect(
      convertClock(20 * 60 + 30, "Africa/Lagos", "Pacific/Auckland", "2026-10-12"),
    ).toEqual({ minutes: 8 * 60 + 30, dayShift: 1 });
    // 5:30 am Lagos is 6:30 pm the previous day in Honolulu.
    expect(
      convertClock(5 * 60 + 30, "Africa/Lagos", "Pacific/Honolulu", "2026-10-12"),
    ).toEqual({ minutes: 18 * 60 + 30, dayShift: -1 });
  });
});

describe("date keys", () => {
  test("knows weekdays and finds the Monday of a week", () => {
    expect(weekdayOf("2026-10-12")).toBe(1);
    expect(weekdayOf("2026-10-18")).toBe(0);
    expect(mondayOf("2026-10-12")).toBe("2026-10-12");
    expect(mondayOf("2026-10-15")).toBe("2026-10-12");
    // A Sunday belongs to the week that started six days earlier.
    expect(mondayOf("2026-10-18")).toBe("2026-10-12");
  });

  test("shifts and measures across a month end", () => {
    expect(shiftDateKey("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftDateKey("2026-11-01", -1)).toBe("2026-10-31");
    expect(daysBetween("2026-10-12", "2026-10-13")).toBe(1);
    expect(daysBetween("2026-10-12", "2026-10-11")).toBe(-1);
    expect(daysBetween("2026-10-31", "2026-11-02")).toBe(2);
  });
});
