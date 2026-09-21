import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import { PRE_SOGP_PREPARATION_DAYS } from "./calendar";

const source = (...parts: string[]) =>
  readFileSync(join(process.cwd(), ...parts), "utf8");

describe("SOGP dashboard previews", () => {
  test("provides deterministic Pre-SOGP and SOGP fixture data", async () => {
    const fixtures = await import("./preview-fixtures");
    const availablePreparationLessons = fixtures.preSogpPreviewData.days
      .map((day) => day.lesson)
      .filter((lesson) => lesson !== null);

    expect(fixtures.preSogpPreviewData.days).toHaveLength(
      PRE_SOGP_PREPARATION_DAYS,
    );
    expect(fixtures.preSogpPreviewData.days[0]?.dateKey).toBe("2026-09-01");
    expect(fixtures.preSogpPreviewData.days.at(-1)?.dateKey).toBe(
      "2026-09-14",
    );
    expect(fixtures.preSogpPreviewData.countdown.phase).toBe("upcoming");
    expect(availablePreparationLessons).toHaveLength(0);
    expect(fixtures.sogpPreviewData.days).toHaveLength(28);
    expect(fixtures.sogpPreviewData.levels).toHaveLength(4);
    expect(fixtures.sogpPreviewData.progress.coreTotal).toBe(24);
    expect(fixtures.sogpPreviewData.levels.map((level) => level.status)).toEqual([
      "complete",
      "in_progress",
      "locked",
      "locked",
    ]);
  });

  test("mounts both previews in local-only mode", () => {
    const preRoute = source(
      "app",
      "preview",
      "dashboard",
      "pre-sogp",
      "page.tsx",
    );
    const sogpRoute = source(
      "app",
      "preview",
      "dashboard",
      "sogp",
      "page.tsx",
    );
    const prePage = source("components", "sogp", "pre-sogp-page.tsx");
    const sogpPage = source("components", "sogp", "sogp-journey-page.tsx");
    const sogpTasks = source("components", "sogp", "sogp-daily-tasks.tsx");
    const sogpOtherDetails = source("components", "sogp", "sogp-other-details.tsx");

    expect(preRoute).toContain("preSogpPreviewData");
    expect(preRoute).toContain("preview");
    expect(sogpRoute).toContain("sogpPreviewData");
    expect(sogpRoute).toContain("preview");
    expect(prePage).toContain("initialData?: PreSogpJourneyData");
    expect(prePage).toContain("Pre-SOGP is coming soon");
    expect(prePage).toContain('data-pre-sogp-section="coming-soon"');
    expect(sogpPage).toContain("initialData?: SogpJourneyData");
    expect(prePage).toContain("Preview mode");
    expect(sogpOtherDetails).toContain("Preview mode");
    expect(sogpPage).toContain(
      'href={preview ? "/preview/dashboard" : "/dashboard"}',
    );
    expect(sogpPage).toContain("SOGP");

    // Header: navy background with white text throughout, less vertical
    // chrome — per the September 2026 dashboard redesign.
    expect(sogpPage).toContain("bg-[var(--color-brand-blue)] text-white");
    expect(sogpPage).toContain("Welcome, {firstName");
    expect(sogpPage.indexOf("bg-[var(--color-brand-blue)] text-white")).toBeLessThan(
      sogpPage.indexOf("Welcome, {firstName"),
    );

    // Tasks section: a single white, decluttered block driven by SogpDailyTasks.
    expect(sogpPage).toContain("<SogpDailyTasks");
    expect(sogpTasks).toContain("bg-white");
    expect(sogpTasks).toContain("done");
    expect(sogpTasks).toContain("task");

    // Other details: a visually separate, light-blue grouped section.
    expect(sogpPage).toContain("<SogpOtherDetails");
    expect(sogpOtherDetails).toContain("bg-[var(--color-brand-sky-soft)]");
    expect(sogpOtherDetails).toContain("Other details");
    expect(sogpOtherDetails).toContain("Course progress");
    expect(sogpOtherDetails).toContain("Invite friends");
    expect(sogpOtherDetails).toContain("Share what you learnt today");
    expect(sogpOtherDetails).toContain("Prayer Watch reminder");
  });
});
