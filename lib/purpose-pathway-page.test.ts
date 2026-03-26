import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("purpose pathway page", () => {
  test("creates a dedicated static route for /purpose", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "(site)", "purpose", "page.tsx"),
      "utf8",
    );

    expect(source).toContain("PurposePathwayView");
  });

  test("reuses the shared nav, community, and footer components", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "home", "purpose-pathway-view.tsx"),
      "utf8",
    );

    expect(source).toContain('from "./homepage-nav"');
    expect(source).toContain('from "./homepage-community-section"');
    expect(source).toContain('from "./homepage-footer"');
    expect(source).toContain("<HomepageNav />");
    expect(source).toContain("<HomepageCommunitySection />");
    expect(source).toContain("<HomepageFooter />");
  });

  test("uses the provided discover header icon inside a purple hero", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "home", "purpose-pathway-view.tsx"),
      "utf8",
    );

    expect(source).toContain("bg-[#68369b]");
    expect(source).toContain("purposePathwayHero.illustrationSrc");
    expect(source).toContain('className="site-hero-heading');
    expect(source).toContain("px-[1.25rem]");
    expect(source).toContain("px-[1.5rem]");
    expect(source).toContain("bottom-[-0.9rem]");
    expect(source).toContain("right-[-2.15rem]");
  });

  test("uses the shared in-page modal playback pattern for purpose videos", () => {
    const viewSource = readFileSync(
      join(process.cwd(), "components", "home", "purpose-pathway-view.tsx"),
      "utf8",
    );
    const gallerySource = readFileSync(
      join(process.cwd(), "components", "home", "purpose-video-gallery.tsx"),
      "utf8",
    );

    expect(viewSource).toContain("PurposeVideoGallery");
    expect(gallerySource).toContain('from "@/components/ui/dialog"');
    expect(gallerySource).toContain("videos.map");
    expect(gallerySource).toContain("<iframe");
    expect(gallerySource).toContain("Loading player...");
    expect(gallerySource).not.toContain(
      "This teaching opens on the original Pleros page.",
    );
    expect(gallerySource).not.toContain("Open teaching");
    expect(gallerySource).not.toContain('target="_blank"');
  });
});
