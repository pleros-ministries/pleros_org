import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  sogpLiveClassAttendance,
  sogpLiveClasses,
  sogpPreparationCompletions,
} from "../db/schema";

describe("SOGP dashboard restructure schema", () => {
  test("persists preparation completion by enrolment and day", () => {
    expect(sogpPreparationCompletions.enrollmentId).toBeDefined();
    expect(sogpPreparationCompletions.preparationDayId).toBeDefined();
    expect(sogpPreparationCompletions.completedAt).toBeDefined();
  });

  test("marks required reviews and how learners completed them", () => {
    expect(sogpLiveClasses.isRequired).toBeDefined();
    expect(sogpLiveClassAttendance.completionSource).toBeDefined();
  });

  test("migrates existing cohort policies away from Podcast and to four reviews", () => {
    const migration = readFileSync(
      join(process.cwd(), "drizzle", "0015_sogp_dashboard_restructure.sql"),
      "utf8",
    );

    expect(migration).toContain("requiredPodcastDailyPercent");
    expect(migration).toContain("requiredLiveClassCount");
    expect(migration).toContain("UPDATE \"sogp_cohorts\"");
  });
});
