import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import {
  isDateWithinSogpWindow,
  isReviewCompletionSource,
} from "./journey";

describe("SOGP journey mutation validation", () => {
  test("accepts only real dates inside the learner window and not after today", () => {
    expect(
      isDateWithinSogpWindow({
        dateKey: "2026-10-10",
        startDateKey: "2026-10-02",
        endDateKey: "2026-10-31",
        todayKey: "2026-10-12",
      }),
    ).toBe(true);
    expect(
      isDateWithinSogpWindow({
        dateKey: "2026-02-30",
        startDateKey: "2026-02-01",
        endDateKey: "2026-03-01",
        todayKey: "2026-03-01",
      }),
    ).toBe(false);
    expect(
      isDateWithinSogpWindow({
        dateKey: "2026-10-13",
        startDateKey: "2026-10-02",
        endDateKey: "2026-10-31",
        todayKey: "2026-10-12",
      }),
    ).toBe(false);
  });

  test("accepts only live and recording review completion sources", () => {
    expect(isReviewCompletionSource("live")).toBe(true);
    expect(isReviewCompletionSource("recording")).toBe(true);
    expect(isReviewCompletionSource("download")).toBe(false);
  });
});

describe("SOGP journey route contract", () => {
  test.each([
    "app/api/sogp/preparation/route.ts",
    "app/api/sogp/preparation/[dayId]/completion/route.ts",
    "app/api/sogp/prayer-watch/route.ts",
    "app/api/sogp/reviews/[liveClassId]/completion/route.ts",
  ])("protects %s with the app session", (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");
    expect(source).toContain("getAppSession");
    expect(source).toContain("Unauthorised");
  });
});
