import { expect, test } from "vitest";

import { buildWeekdayReleaseDates } from "./schedule";

test("builds 20 weekday releases across four weeks", () => {
  const releases = buildWeekdayReleaseDates(
    new Date("2026-09-07T06:00:00+01:00"),
    20,
  );
  expect(releases).toHaveLength(20);
  expect(releases[0]?.toISOString()).toBe("2026-09-07T05:00:00.000Z");
  expect(releases[4]?.toISOString()).toBe("2026-09-11T05:00:00.000Z");
  expect(releases[5]?.toISOString()).toBe("2026-09-14T05:00:00.000Z");
  expect(releases.every((date) => ![0, 6].includes(date.getUTCDay()))).toBe(true);
});
