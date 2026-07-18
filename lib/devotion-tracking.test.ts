import { readFileSync } from "fs";
import { join } from "path";

import { describe, expect, test } from "vitest";

import {
  getDiscipleshipJourneySection,
  getDiscipleshipJourneySeriesCards,
} from "./discipleship-journey-content";

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
    expect(podcastPage).toContain("requestSubmit");
    expect(podcastPage).toContain("handleEpisodeRowClick");
    expect(podcastPage).toContain('closest("a,button,input,label")');
    expect(podcastPage).toContain("Mark all as listened");
    expect(podcastPage).toContain("allEpisodesListened");
    expect(podcastPage).toContain("Mark all as unlistened");
    expect(podcastPage).toContain("onSetListened");
    expect(podcastPage).toContain("ChevronDownIcon");
    expect(podcastPage).toContain("aria-expanded={!isCollapsed}");
    expect(podcastPage).toContain("aria-controls={contentId}");
    expect(podcastPage).toContain("transition-[grid-template-rows,opacity]");
    expect(podcastPage).toContain("grid-rows-[0fr]");
    expect(podcastPage).toContain("grid-rows-[1fr]");
    expect(podcastPage).toContain("defaultCollapsed");
    expect(podcastPage).toContain("defaultCollapsed={index > 0}");
    expect(podcastPage).toContain('isCollapsed ? "px-4 py-3 sm:px-5"');
    expect(podcastPage).not.toContain("Select unlistened");
    expect(podcastPage).not.toContain("Mark unlistened as listened");
    expect(podcastPage).not.toContain("Mark selected as listened");
    expect(podcastPage).not.toContain("Mark listened");
    expect(podcastPage).toContain("Listened");
    expect(podcastPage).toContain("href={episode.link}");
    expect(podcastPage).not.toContain("ClockIcon");
    expect(podcastPage).not.toContain("formatDuration");
    expect(podcastPage).not.toContain("Open episode");
    expect(actions).toContain("togglePodcastEpisodeProgressAction");
    expect(actions).toContain("markSelectedPodcastEpisodesListenedAction");
    expect(queries).toContain("getPodcastEpisodeProgress");
    expect(schema).toContain("podcastEpisodeProgress");
  });

  test("keeps podcast progress controls comfortable on mobile", () => {
    const podcastPage = source("components", "dashboard", "podcast-progress-page.tsx");

    expect(podcastPage).toContain("grid-cols-[auto_minmax(0,1fr)]");
    expect(podcastPage).toContain('className="grid gap-1.5"');
    expect(podcastPage).toContain("min-h-11 min-w-11");
    expect(podcastPage).toContain("size-5");
    expect(podcastPage).toContain("px-4 py-5");
    expect(podcastPage).toContain("h-10 pl-9");
    expect(podcastPage).toContain("rounded-full");
    expect(podcastPage).toContain('size="sm"');
    expect(podcastPage).toContain("w-fit rounded-full px-4");
    expect(podcastPage).not.toContain("w-full rounded-full");
    expect(podcastPage).toContain("previewMode");
  });

  test("provides sign-in-free preview routes for dashboard tracking surfaces", () => {
    const previewDashboard = source("app", "preview", "dashboard", "page.tsx");
    const previewPrayer = source(
      "app",
      "preview",
      "dashboard",
      "prayer-watch",
      "page.tsx",
    );
    const previewPodcast = source(
      "app",
      "preview",
      "dashboard",
      "podcast",
      "page.tsx",
    );
    const dashboardView = source("components", "dashboard", "welcome-dashboard-view.tsx");

    expect(previewDashboard).toContain("previewDashboardSections");
    expect(previewDashboard).toContain("/preview/dashboard/prayer-watch");
    expect(previewDashboard).toContain("/preview/dashboard/podcast");
    expect(previewPrayer).toContain("PrayerWatchPage");
    expect(previewPrayer).toContain("bibleReadingLogs");
    expect(previewPodcast).toContain("PodcastProgressPage");
    expect(previewPodcast).toContain("previewPodcastEpisodes");
    expect(previewPodcast).toContain("previewMode");
    expect(dashboardView).toContain("sections = welcomeDashboardSections");
  });

  test("routes discipleship journey through series cards before the video list", () => {
    const content = source("lib", "discipleship-journey-content.ts");
    const dashboardPage = source(
      "components",
      "dashboard",
      "discipleship-journey-page.tsx",
    );
    const gallery = source(
      "components",
      "dashboard",
      "discipleship-journey-gallery.tsx",
    );
    const seriesPage = source(
      "components",
      "dashboard",
      "discipleship-journey-series-page.tsx",
    );
    const seriesRoute = source(
      "app",
      "(site)",
      "dashboard",
      "discipleship-journey",
      "[seriesId]",
      "page.tsx",
    );
    const previewDashboard = source("app", "preview", "dashboard", "page.tsx");
    const previewJourney = source(
      "app",
      "preview",
      "dashboard",
      "discipleship-journey",
      "page.tsx",
    );
    const previewSeries = source(
      "app",
      "preview",
      "dashboard",
      "discipleship-journey",
      "[seriesId]",
      "page.tsx",
    );

    expect(content).toContain("getDiscipleshipJourneySection");
    expect(content).toContain("href: `/dashboard/discipleship-journey/${section.id}`");
    expect(dashboardPage).toContain("DiscipleshipJourneySeriesGrid");
    expect(dashboardPage).toContain("rounded-[var(--radius-md)]");
    expect(dashboardPage).toContain("aspect-[0.78]");
    expect(dashboardPage).toContain("priority");
    expect(dashboardPage).not.toContain("<DiscipleshipJourneyGallery sections={sections}");
    expect(gallery).toContain("backHref");
    expect(gallery).toContain("Back to series");
    expect(seriesRoute).toContain("getDiscipleshipJourneySection");
    expect(seriesRoute).toContain("notFound()");
    expect(seriesPage).toContain("DiscipleshipJourneyGallery");
    expect(seriesPage).toContain("Watch the teachings in this series from top to bottom.");
    expect(seriesPage).not.toContain("Your Discipleship Journey");
    expect(previewDashboard).toContain("/preview/dashboard/discipleship-journey");
    expect(previewJourney).toContain("DiscipleshipJourneyPage");
    expect(previewJourney).toContain("previewHrefPrefix");
    expect(previewSeries).toContain("DiscipleshipJourneySeriesPage");
    expect(previewSeries).toContain("previewHrefPrefix");
  });

  test("uses representative thumbnails for discipleship journey series cards", () => {
    const cards = getDiscipleshipJourneySeriesCards();
    const gospelSection = getDiscipleshipJourneySection("gospel-answers-simple");
    const gospelCard = cards.find((card) => card.id === "gospel-answers-simple");
    const purposeCard = cards.find((card) => card.id === "discover-purpose");

    expect(cards).toHaveLength(3);
    expect(gospelCard?.thumbnailSrc).toBe(gospelSection?.videos[0]?.thumbnailSrc);
    expect(purposeCard?.thumbnailSrc.startsWith("/site/home/assets/")).toBe(true);
    expect(cards.some((card) => card.thumbnailSrc.includes("gospel-answers-simple-series"))).toBe(
      false,
    );
  });
});
