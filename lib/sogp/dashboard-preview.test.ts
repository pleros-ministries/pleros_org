import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

const source = (...parts: string[]) =>
  readFileSync(join(process.cwd(), ...parts), "utf8");

describe("SOGP dashboard previews", () => {
  test("provides deterministic Pre-SOGP and SOGP fixture data", async () => {
    const fixtures = await import("./preview-fixtures");
    const availablePreparationLessons = fixtures.preSogpPreviewData.days
      .map((day) => day.lesson)
      .filter((lesson) => lesson !== null);

    expect(fixtures.preSogpPreviewData.days).toHaveLength(30);
    expect(new Set(availablePreparationLessons.map((lesson) => lesson.url)).size)
      .toBe(availablePreparationLessons.length);
    expect(availablePreparationLessons[0]?.title).toBe(
      "What is God's Purpose? (Part 1)",
    );
    expect(availablePreparationLessons.at(-1)?.title).toBe(
      "Gospel Answers Series 9",
    );
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

    expect(preRoute).toContain("preSogpPreviewData");
    expect(preRoute).toContain("preview");
    expect(sogpRoute).toContain("sogpPreviewData");
    expect(sogpRoute).toContain("preview");
    expect(prePage).toContain("initialData?: PreSogpJourneyData");
    expect(sogpPage).toContain("initialData?: SogpJourneyData");
    expect(prePage).toContain("Preview mode");
    expect(sogpPage).toContain("Preview mode");
    expect(sogpPage).toContain(
      'className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"',
    );
    expect(sogpPage).toContain("text-xl font-semibold");
    expect(sogpPage).not.toContain(
      'className="grid gap-1">\n            <p',
    );
    expect(sogpPage).toContain(
      '<nav aria-label="SOGP dashboard navigation"',
    );
    expect(sogpPage.indexOf("SOGP dashboard navigation")).toBeLessThan(
      sogpPage.indexOf("Welcome, {firstName"),
    );
    expect(sogpPage).toContain(
      'href={preview ? "/preview/dashboard" : "/dashboard"}',
    );
    expect(sogpPage).toContain(">SOGP</span>");
    expect(sogpPage).toContain(
      "border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]",
    );
    expect(sogpPage).toContain("text-white/88");
    expect(sogpPage).toContain("text-[var(--color-brand-lime)]");
  });
});
