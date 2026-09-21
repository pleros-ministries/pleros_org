import { describe, expect, test } from "vitest";

import { buildDailyReviewSessions } from "./daily-reviews";

// Cohort 1: Mon 14 Sep 2026 00:00 Lagos through Sun 11 Oct 2026 23:59:59 Lagos.
const startsAt = new Date("2026-09-14T00:00:00+01:00");
const endsAt = new Date("2026-10-11T23:59:59.999+01:00");
const early = new Date("2026-09-01T00:00:00Z");

describe("buildDailyReviewSessions", () => {
  const sessions = buildDailyReviewSessions({ startsAt, endsAt, now: early });

  test("creates one session for each of the 28 days", () => {
    expect(sessions).toHaveLength(28);
  });

  test("runs Monday to Saturday 8:00-8:30pm Lagos", () => {
    expect(sessions[0]?.startsAt.toISOString()).toBe("2026-09-14T19:00:00.000Z");
    expect(sessions[0]?.endsAt.toISOString()).toBe("2026-09-14T19:30:00.000Z");
  });

  test("runs Sundays 7:00-8:00pm Lagos", () => {
    const sunday = sessions.find((s) => s.startsAt.toISOString().startsWith("2026-09-20"));
    expect(sunday?.startsAt.toISOString()).toBe("2026-09-20T18:00:00.000Z");
    expect(sunday?.endsAt.toISOString()).toBe("2026-09-20T19:00:00.000Z");
    expect(sessions.filter((s) => s.endsAt.getTime() - s.startsAt.getTime() === 60 * 60 * 1000)).toHaveLength(4);
  });

  test("skips sessions that have already ended", () => {
    const now = new Date("2026-09-21T19:15:00.000Z"); // Mon 21 Sep 8:15pm Lagos: that day's review is still running
    const remaining = buildDailyReviewSessions({ startsAt, endsAt, now });
    expect(remaining[0]?.startsAt.toISOString()).toBe("2026-09-21T19:00:00.000Z");
    expect(remaining).toHaveLength(21);
  });
});
