import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("podcast page", () => {
  test("uses a dedicated route with real podcast sections and journey CTAs", () => {
    const routePath = join(process.cwd(), "app", "(site)", "podcast", "page.tsx");
    const viewPath = join(
      process.cwd(),
      "components",
      "home",
      "podcast-page-view.tsx",
    );
    const galleryPath = join(
      process.cwd(),
      "components",
      "home",
      "podcast-video-gallery.tsx",
    );
    const seriesGalleryPath = join(
      process.cwd(),
      "components",
      "home",
      "podcast-series-gallery.tsx",
    );
    const seriesEpisodesPath = join(
      process.cwd(),
      "lib",
      "podcast-series-episodes.ts",
    );
    const contentPath = join(process.cwd(), "lib", "podcast-page-content.ts");

    expect(existsSync(routePath)).toBe(true);
    expect(existsSync(viewPath)).toBe(true);
    expect(existsSync(galleryPath)).toBe(true);
    expect(existsSync(seriesGalleryPath)).toBe(true);
    expect(existsSync(seriesEpisodesPath)).toBe(true);
    expect(existsSync(contentPath)).toBe(true);

    const routeSource = readFileSync(routePath, "utf8");
    const viewSource = readFileSync(viewPath, "utf8");
    const gallerySource = readFileSync(galleryPath, "utf8");
    const seriesGallerySource = readFileSync(seriesGalleryPath, "utf8");
    const contentSource = readFileSync(contentPath, "utf8");

    expect(routeSource).toContain("PodcastPageView");
    expect(viewSource).toContain("getLatestYoutubeEpisode");
    expect(viewSource).toContain("PodcastVideoGallery");
    expect(viewSource).toContain("PodcastSeriesGallery");
    expect(viewSource).toContain("groupPodcastSeriesEpisodes");
    expect(gallerySource).toContain("<iframe");
    expect(seriesGallerySource).toContain("DialogContent");
    expect(seriesGallerySource).toContain(
      "Jump to any of the series on the podcast",
    );
    expect(seriesGallerySource).toContain(">Series<");
    expect(seriesGallerySource).toContain("getDownloadHref");
    expect(seriesGallerySource).toContain("ep.link");
    expect(viewSource).toContain('id="journey"');
    expect(viewSource).toContain("Why this podcast helps");
    expect(viewSource).toContain("HomepageCommunitySection");
    expect(viewSource).toContain("HomepageFooter");
    expect(contentSource).toContain('title: "Pleros Podcast"');
    expect(contentSource).toContain(
      "Your 15-minute dose of transformation, wherever you listen",
    );
    expect(contentSource).toContain("Subscribe on YouTube");
    expect(contentSource).toContain("The Place of the Gospel in Your Life");
    expect(contentSource).toContain(
      "Is the Gospel only about salvation, or is there more to it?",
    );
    expect(contentSource).toContain("Favour in the Newness of Life");
    expect(contentSource).toContain("Our Righteous Nature in Christ");
    expect(contentSource).toContain("Our Love Nature in Christ");
    expect(contentSource).toContain("PLeX3pQHW9Ln6OrlldW4z22pJ6ptUQ-UwQ");
    expect(contentSource).toContain('href: "/questions"');
    expect(contentSource).toContain('href: "/purpose"');
    expect(contentSource).toContain('href: "/ppc"');
  });
});
