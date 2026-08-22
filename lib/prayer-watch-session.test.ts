import { expect, test } from "vitest";

import { isPrayerWatchSession } from "./prayer-watch-session";

test("accepts only loggable Prayer Watch sessions", () => {
  expect(isPrayerWatchSession("morning")).toBe(true);
  expect(isPrayerWatchSession("afternoon")).toBe(true);
  expect(isPrayerWatchSession("evening")).toBe(true);
  expect(isPrayerWatchSession("unspecified")).toBe(false);
  expect(isPrayerWatchSession("midnight")).toBe(false);
});
