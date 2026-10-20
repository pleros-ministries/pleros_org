import { expect, test } from "vitest";

import { isLoggablePrayerSession, isPrayerWatchSession } from "./prayer-watch-session";

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
