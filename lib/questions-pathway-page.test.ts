import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("questions pathway page", () => {
  test("creates a dedicated static route for /questions", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "(site)", "questions", "page.tsx"),
      "utf8",
    );

    expect(source).toContain("QuestionsPathwayView");
  });

  test("reuses the shared home navigation, community, and footer components", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "components",
        "home",
        "questions-pathway-view.tsx",
      ),
      "utf8",
    );

    expect(source).toContain('from "./homepage-nav"');
    expect(source).toContain('from "./homepage-community-section"');
    expect(source).toContain('from "./homepage-footer"');
    expect(source).toContain("<HomepageNav />");
    expect(source).toContain("<HomepageCommunitySection />");
    expect(source).toContain("<HomepageFooter />");
  });

  test("keeps the hero heading in Sen and anchors the illustration lower on the right", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "components",
        "home",
        "questions-pathway-view.tsx",
      ),
      "utf8",
    );

    expect(source).toContain('className="site-hero-heading');
    expect(source).toContain("justify-end");
    expect(source).toContain("bottom-[-0.5rem]");
    expect(source).toContain("right-[-1.5rem]");
  });

  test("creates a reusable sub-page route for each questions series", () => {
    const routeSource = readFileSync(
      join(
        process.cwd(),
        "app",
        "(site)",
        "questions",
        "[seriesSlug]",
        "page.tsx",
      ),
      "utf8",
    );
    const viewSource = readFileSync(
      join(
        process.cwd(),
        "components",
        "home",
        "questions-series-page-view.tsx",
      ),
      "utf8",
    );
    const gallerySource = readFileSync(
      join(
        process.cwd(),
        "components",
        "home",
        "questions-series-video-gallery.tsx",
      ),
      "utf8",
    );

    expect(routeSource).toContain("generateStaticParams");
    expect(routeSource).toContain("getQuestionsSeriesPage");
    expect(routeSource).toContain("QuestionsSeriesPageView");
    expect(viewSource).toContain('from "./homepage-nav"');
    expect(viewSource).toContain('from "./homepage-community-section"');
    expect(viewSource).toContain('from "./homepage-footer"');
    expect(viewSource).toContain("QuestionsSeriesVideoGallery");
    expect(viewSource).toContain("px-[1.25rem]");
    expect(viewSource).toContain("px-[1.5rem]");
    expect(gallerySource).toContain('from "@/components/ui/dialog"');
    expect(gallerySource).toContain("series.videos.map");
    expect(gallerySource).toContain("<iframe");
    expect(gallerySource).toContain("Loading player...");
    expect(gallerySource).toContain("onLoad={() => setIsPlayerReady(true)}");
    expect(gallerySource).not.toContain('target="_blank"');
  });
});
