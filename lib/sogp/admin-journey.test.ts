import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  buildPreSogpSeed,
  validateSogpLaunchReadiness,
} from "./preparation-seed";

describe("Pre-SOGP seed", () => {
  test("builds 30 unique consecutive lessons in the approved content order", () => {
    const days = buildPreSogpSeed(
      new Date("2026-11-01T00:00:00+01:00"),
    );

    expect(days).toHaveLength(30);
    expect(new Set(days.map((day) => day.url)).size).toBe(30);
    expect(days[0]).toMatchObject({
      publishDate: "2026-10-02",
      title: "What is God's Purpose? (Part 1)",
    });
    expect(days[7]?.title).toBe("Gospel Answers Series 1");
    expect(days[19]?.title).toBe("Salvation");
    expect(days.at(-1)?.publishDate).toBe("2026-10-31");
  });
});

test("admin actions seed preparation and validate cohort activation", () => {
  const source = readFileSync(
    join(process.cwd(), "app", "admin", "_actions", "sogp-actions.ts"),
    "utf8",
  );
  expect(source).toContain("seedSogpPreparation");
  expect(source).toContain("buildPreSogpSeed");
  expect(source).toContain("validateSogpLaunchReadiness");
  expect(source).toContain("updateSogpLiveClass");
  expect(source).toContain('revalidatePath("/admin/sogp")');
});

test("admin exposes scoped learner progress correction controls", () => {
  const actions = readFileSync(
    join(process.cwd(), "app", "admin", "_actions", "sogp-actions.ts"),
    "utf8",
  );
  const controls = readFileSync(
    join(process.cwd(), "components", "ppc", "admin-sogp-progress-corrections.tsx"),
    "utf8",
  );
  expect(actions).toContain("correctSogpPreparationCompletion");
  expect(actions).toContain("correctSogpPrayerCompletion");
  expect(actions).toContain("correctSogpReviewCompletion");
  expect(controls).toContain("Correct learner progress");
  expect(controls).toContain("Preparation lesson");
  expect(controls).toContain("Prayer Watch date");
  expect(controls).toContain("Review session");
});

describe("SOGP launch readiness", () => {
  test("requires 30 preparation lessons, 20 core tracks, four extras, and four reviews", () => {
    expect(
      validateSogpLaunchReadiness({
        preparationCount: 29,
        uniquePreparationUrlCount: 29,
        readyCoreTrackCount: 19,
        extraTrackCount: 3,
        requiredReviewCount: 3,
      }),
    ).toEqual([
      "Add exactly 30 unique Pre-SOGP lessons.",
      "Publish 20 content-ready core teachings.",
      "Assign four optional extra teachings.",
      "Schedule four required review sessions.",
    ]);
  });

  test("accepts a complete cohort configuration", () => {
    expect(
      validateSogpLaunchReadiness({
        preparationCount: 30,
        uniquePreparationUrlCount: 30,
        readyCoreTrackCount: 20,
        extraTrackCount: 4,
        requiredReviewCount: 4,
      }),
    ).toEqual([]);
  });
});
