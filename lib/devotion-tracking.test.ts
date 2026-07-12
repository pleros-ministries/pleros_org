import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, test } from "vitest";

function source(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

describe("dashboard devotion tracking", () => {
  test("extends Prayer Watch with Bible reading tabs and persistence", () => {
    const prayerPage = source("components", "dashboard", "prayer-watch-page.tsx");
    const actions = source("app", "_actions", "prayer-watch-actions.ts");
    const queries = source("lib", "db", "queries", "bible-reading.ts");
    const schema = source("lib", "db", "schema.ts");

    expect(prayerPage).toContain("Prayer");
    expect(prayerPage).toContain("Bible reading");
    expect(prayerPage).toContain("chaptersRead");
    expect(prayerPage).toContain("currentBook");
    expect(prayerPage).toContain("currentChapter");
    expect(prayerPage).toContain("BibleReadingProjectionFootnote");
    expect(actions).toContain("saveBibleReadingLogAction");
    expect(queries).toContain("upsertBibleReadingLog");
    expect(schema).toContain("bibleReadingLogs");
  });

  test("routes the dashboard podcast card to episode progress tracking", () => {
    const dashboardContent = source("lib", "welcome-dashboard-content.ts");
    const podcastRoute = source("app", "(site)", "dashboard", "podcast", "page.tsx");
    const podcastPage = source("components", "dashboard", "podcast-progress-page.tsx");
    const actions = source("app", "_actions", "podcast-progress-actions.ts");
    const queries = source("lib", "db", "queries", "podcast-progress.ts");
    const schema = source("lib", "db", "schema.ts");

    expect(dashboardContent).toContain('href: "/dashboard/podcast"');
    expect(podcastRoute).toContain("PodcastProgressPage");
    expect(podcastPage).toContain("groupPodcastEpisodesBySeries");
    expect(podcastPage).toContain("type=\"checkbox\"");
    expect(podcastPage).toContain("Mark selected as listened");
    expect(podcastPage).toContain("Mark listened");
    expect(podcastPage).toContain("Listened");
    expect(actions).toContain("togglePodcastEpisodeProgressAction");
    expect(actions).toContain("markSelectedPodcastEpisodesListenedAction");
    expect(queries).toContain("getPodcastEpisodeProgress");
    expect(schema).toContain("podcastEpisodeProgress");
  });

  test("keeps podcast progress controls comfortable on mobile", () => {
    const podcastPage = source("components", "dashboard", "podcast-progress-page.tsx");

    expect(podcastPage).toContain("min-h-11 min-w-11");
    expect(podcastPage).toContain("size-5");
    expect(podcastPage).toContain("w-full sm:w-auto");
    expect(podcastPage).toContain("grid gap-2 sm:flex");
  });
});
