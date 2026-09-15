import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { PRE_SOGP_PREPARATION_DAYS } from "./calendar";
import {
  buildPreSogpSeed,
  isSogpLessonContentReady,
  validateSogpLaunchReadiness,
} from "./preparation-seed";

describe("Pre-SOGP seed", () => {
  test("builds one unique consecutive lesson per preparation day in the approved content order", () => {
    const days = buildPreSogpSeed(
      new Date("2026-11-01T00:00:00+01:00"),
    );

    expect(days).toHaveLength(PRE_SOGP_PREPARATION_DAYS);
    expect(new Set(days.map((day) => day.url)).size).toBe(
      PRE_SOGP_PREPARATION_DAYS,
    );
    expect(days[0]).toMatchObject({
      publishDate: "2026-11-01",
      title: "What is God's Purpose? (Part 1)",
    });
    expect(days[5]?.title).toBe("What is God's Purpose? (Part 6)");
    expect(days.every((day) => !day.title.includes("Part 7"))).toBe(true);
    expect(days[6]?.title).toBe("Gospel Answers Series 1");
    expect(days.at(-1)?.publishDate).toBe("2026-11-14");
  });
});

test("requires complete teaching and assessment content before activation", () => {
  const readyLesson = {
    status: "published",
    audioUrl: "https://example.com/audio.mp3",
    notesContent: "Notes",
    responsePrompt: "Respond",
    responseMarkingGuide: "Guide",
    hasQuiz: true,
  };
  expect(isSogpLessonContentReady(readyLesson)).toBe(true);
  expect(isSogpLessonContentReady({ ...readyLesson, hasQuiz: false })).toBe(false);
  expect(isSogpLessonContentReady({ ...readyLesson, responsePrompt: null })).toBe(false);
});

test("admin actions seed preparation and validate cohort activation", () => {
  const source = readFileSync(
    join(process.cwd(), "app", "admin", "_actions", "sogp-actions.ts"),
    "utf8",
  );
  expect(source).toContain("seedSogpPreparation");
  expect(source).toContain("buildPreSogpSeed");
  expect(source).toContain("transactionDb.transaction");
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

test("admin exposes cohort date and status controls", () => {
  const source = readFileSync(
    join(process.cwd(), "components", "ppc", "admin-sogp-cohort-controls.tsx"),
    "utf8",
  );
  expect(source).toContain("Cohort dates and status");
  expect(source).toContain("updateSogpCohort");
  expect(source).toContain('type="datetime-local"');
  expect(source).toContain("Activate cohort");
});

describe("SOGP launch readiness", () => {
  test("requires a full preparation window, every assigned track ready, and four reviews", () => {
    expect(
      validateSogpLaunchReadiness({
        preparationCount: PRE_SOGP_PREPARATION_DAYS - 1,
        uniquePreparationUrlCount: PRE_SOGP_PREPARATION_DAYS - 1,
        requiredTrackCount: 24,
        readyTrackCount: 23,
        requiredReviewCount: 3,
      }),
    ).toEqual([
      `Add exactly ${PRE_SOGP_PREPARATION_DAYS} unique Pre-SOGP lessons.`,
      "Publish content-ready SOGP teachings for every track assigned to this cohort.",
      "Schedule four required review sessions.",
    ]);
  });

  test("accepts a complete cohort configuration", () => {
    expect(
      validateSogpLaunchReadiness({
        preparationCount: PRE_SOGP_PREPARATION_DAYS,
        uniquePreparationUrlCount: PRE_SOGP_PREPARATION_DAYS,
        requiredTrackCount: 24,
        readyTrackCount: 24,
        requiredReviewCount: 4,
      }),
    ).toEqual([]);
  });

  test("accepts a cohort whose curriculum is still being rolled out incrementally", () => {
    expect(
      validateSogpLaunchReadiness({
        preparationCount: PRE_SOGP_PREPARATION_DAYS,
        uniquePreparationUrlCount: PRE_SOGP_PREPARATION_DAYS,
        requiredTrackCount: 10,
        readyTrackCount: 10,
        requiredReviewCount: 4,
      }),
    ).toEqual([]);
  });

  test("rejects a cohort with no tracks assigned yet", () => {
    expect(
      validateSogpLaunchReadiness({
        preparationCount: PRE_SOGP_PREPARATION_DAYS,
        uniquePreparationUrlCount: PRE_SOGP_PREPARATION_DAYS,
        requiredTrackCount: 0,
        readyTrackCount: 0,
        requiredReviewCount: 4,
      }),
    ).toEqual([
      "Publish content-ready SOGP teachings for every track assigned to this cohort.",
    ]);
  });
});

test("admin curriculum configuration uses the fixed canonical map", () => {
  const actions = readFileSync(
    join(process.cwd(), "app", "admin", "_actions", "sogp-actions.ts"),
    "utf8",
  );
  const page = readFileSync(
    join(process.cwd(), "components", "ppc", "admin-sogp-page.tsx"),
    "utf8",
  );

  expect(actions).toContain("buildFirstCohortTrackSelection()");
  expect(actions).toContain("buildSogpTrackReleaseDates");
  expect(actions).toContain("assertMondayCohortStart");
  expect(actions).not.toContain("optionalPracticalLessonNumbers");
  expect(page).toContain("24 required teachings across four levels");
  expect(page).not.toContain("Practical track placement");
  expect(page).not.toContain("four Extras");
});
