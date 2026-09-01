import { expect, test } from "vitest";

import {
  assertMondayCohortStart,
  buildSogpReviewDates,
  buildSogpTrackReleaseDates,
} from "./schedule";

const monday = new Date("2026-09-14T06:00:00+01:00");

test("builds 24 Monday-to-Saturday releases across four weeks", () => {
  const releases = buildSogpTrackReleaseDates(monday);

  expect(releases).toHaveLength(24);
  expect(releases[0]?.toISOString()).toBe("2026-09-14T05:00:00.000Z");
  expect(releases.slice(0, 6).map((date) => date.getUTCDay())).toEqual([
    1, 2, 3, 4, 5, 6,
  ]);
  expect(releases[6]?.toISOString()).toBe("2026-09-21T05:00:00.000Z");
  expect(releases[23]?.toISOString()).toBe("2026-10-10T05:00:00.000Z");
});

test("builds one Sunday review after each teaching week", () => {
  const reviews = buildSogpReviewDates(monday);

  expect(reviews).toHaveLength(4);
  expect(reviews[0]?.toISOString()).toBe("2026-09-20T05:00:00.000Z");
  expect(reviews[3]?.toISOString()).toBe("2026-10-11T05:00:00.000Z");
});

test("requires cohorts to start on Monday in Lagos", () => {
  expect(() => assertMondayCohortStart(monday)).not.toThrow();
  expect(() =>
    assertMondayCohortStart(new Date("2026-09-15T06:00:00+01:00")),
  ).toThrow("SOGP cohorts must start on Monday.");
});
