import { expect, test } from "vitest";

import { deriveLiveClassState } from "./live-class-status";

test.each([
  ["2026-09-12T08:00:00Z", "upcoming"],
  ["2026-09-12T10:30:00Z", "live"],
  ["2026-09-12T13:00:00Z", "ended"],
] as const)("derives %s as %s", (now, expected) => {
  expect(
    deriveLiveClassState({
      now: new Date(now),
      startsAt: new Date("2026-09-12T10:00:00Z"),
      endsAt: new Date("2026-09-12T12:00:00Z"),
      status: "scheduled",
    }),
  ).toBe(expected);
});

test("preserves cancelled state", () => {
  expect(
    deriveLiveClassState({
      now: new Date(),
      startsAt: new Date(),
      endsAt: new Date(),
      status: "cancelled",
    }),
  ).toBe("cancelled");
});
