import { expect, test } from "vitest";

import { countDistinctLagosActivityDays } from "./formation-progress";

test("counts at most one podcast completion per Lagos calendar day", () => {
  expect(
    countDistinctLagosActivityDays([
      new Date("2026-09-14T10:00:00Z"),
      new Date("2026-09-14T20:00:00Z"),
      new Date("2026-09-14T23:30:00Z"),
      new Date("2026-09-15T11:00:00Z"),
      new Date("2026-09-15T23:30:00Z"),
    ]),
  ).toBe(3);
});

test("returns zero when no podcast activity is logged", () => {
  expect(countDistinctLagosActivityDays([])).toBe(0);
});
