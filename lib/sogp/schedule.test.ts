import { expect, test } from "vitest";

import {
  assertMondayCohortStart,
  buildSogpReviewDates,
  buildSogpTrackReleaseDates,
  resolveFirstReleaseAt,
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

test("resolves the Lagos calendar date even when startsAt is stored as prior-day UTC midnight", () => {
  // A cohort starting 2026-09-14T00:00 Lagos is stored as 2026-09-13T23:00Z.
  const storedStartsAt = new Date("2026-09-13T23:00:00.000Z");
  const resolved = resolveFirstReleaseAt(storedStartsAt);

  expect(resolved.toISOString()).toBe("2026-09-14T05:00:00.000Z");
  expect(() => assertMondayCohortStart(resolved)).not.toThrow();
});

test("requires cohorts to start on Monday in Lagos", () => {
  expect(() => assertMondayCohortStart(monday)).not.toThrow();
  expect(() =>
    assertMondayCohortStart(new Date("2026-09-15T06:00:00+01:00")),
  ).toThrow("SOGP cohorts must start on Monday.");
});
