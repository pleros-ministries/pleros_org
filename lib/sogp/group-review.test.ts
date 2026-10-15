import { describe, expect, test } from "vitest";

import {
  canCorrectReviewAttendance,
  REVIEW_CORRECTION_WINDOW_DAYS,
} from "./group-review";

describe("canCorrectReviewAttendance", () => {
  test("allows corrections within 7 days of confirmation", () => {
    expect(REVIEW_CORRECTION_WINDOW_DAYS).toBe(7);
    expect(canCorrectReviewAttendance("2026-10-10T17:00:00Z", "2026-10-17T17:00:00Z")).toBe(true);
    expect(canCorrectReviewAttendance("2026-10-10T17:00:00Z", "2026-10-17T17:00:01Z")).toBe(false);
    expect(canCorrectReviewAttendance("2026-10-10T17:00:00Z", "2026-10-20T00:00:00Z")).toBe(false);
  });

  test("rejects invalid dates", () => {
    expect(canCorrectReviewAttendance("not-a-date", "2026-10-10T17:00:00Z")).toBe(false);
  });
});
