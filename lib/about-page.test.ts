import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("about page", () => {
  test("creates a dedicated static route for /about", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "(site)", "about", "page.tsx"),
      "utf8",
    );

    expect(source).toContain("AboutPageView");
  });

  test("reuses the shared nav, community, and footer components", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "home", "about-page-view.tsx"),
      "utf8",
    );

    expect(source).toContain('from "./homepage-nav"');
    expect(source).toContain('from "./homepage-community-section"');
    expect(source).toContain('from "./homepage-footer"');
    expect(source).toContain("<HomepageNav />");
    expect(source).toContain("<HomepageCommunitySection />");
    expect(source).toContain("<HomepageFooter />");
  });

  test("uses a pale blue hero and centered manifesto block", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "home", "about-page-view.tsx"),
      "utf8",
    );

    expect(source).toContain("bg-[#d2f1ff]");
    expect(source).toContain("aboutPageLeadLines.map");
    expect(source).toContain("text-center");
  });
});
