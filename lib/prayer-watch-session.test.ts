import { expect, test } from "vitest";

import { isLoggablePrayerSession, isPrayerWatchSession, prayerSessionsLine } from "./prayer-watch-session";

test("accepts only loggable Prayer Watch sessions", () => {
  expect(isPrayerWatchSession("morning")).toBe(true);
  expect(isPrayerWatchSession("afternoon")).toBe(true);
  expect(isPrayerWatchSession("evening")).toBe(true);
  expect(isPrayerWatchSession("unspecified")).toBe(false);
  expect(isPrayerWatchSession("midnight")).toBe(false);
});

test("Another time is loggable on reports while Prayer Watch sessions stay three", () => {
  expect(isLoggablePrayerSession("unspecified")).toBe(true);
  expect(isLoggablePrayerSession("morning")).toBe(true);
  expect(isLoggablePrayerSession("midnight")).toBe(false);
  expect(isPrayerWatchSession("unspecified")).toBe(false);
});

test("the day's line shows the times prayed under Another time", () => {
  expect(prayerSessionsLine(["morning"])).toBe("morning");
  expect(prayerSessionsLine(["morning", "unspecified"])).toBe("morning, another time");
  expect(prayerSessionsLine(["unspecified"], ["22:15", "06:05"])).toBe("6:05 am, 10:15 pm");
  expect(prayerSessionsLine(["evening", "unspecified"], ["13:00"])).toBe("evening, 1:00 pm");
  expect(prayerSessionsLine([])).toBeNull();
});
