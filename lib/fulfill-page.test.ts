import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("fulfill page", () => {
  test("uses a dedicated route and points visitors into SOGP as the next step", () => {
    const routePath = join(process.cwd(), "app", "(site)", "fulfil", "page.tsx");
    const viewPath = join(
      process.cwd(),
      "components",
      "home",
      "fulfill-page-view.tsx",
    );
    const contentPath = join(process.cwd(), "lib", "fulfill-page-content.ts");

    expect(existsSync(routePath)).toBe(true);
    expect(existsSync(viewPath)).toBe(true);
    expect(existsSync(contentPath)).toBe(true);

    const routeSource = readFileSync(routePath, "utf8");
    const viewSource = readFileSync(viewPath, "utf8");
    const contentSource = readFileSync(contentPath, "utf8");

    expect(routeSource).toContain("FulfillPageView");
    expect(viewSource).toContain("HomepageNav");
    expect(viewSource).toContain("HomepageCommunitySection");
    expect(viewSource).toContain("HomepageFooter");
    expect(viewSource).toContain("What happens when you start");
    expect(viewSource).toContain("SOGP moves through three levels");
    expect(contentSource).toContain("School of God's Purpose");
    expect(contentSource).toContain("SOGP is the course platform for growth.");
    expect(contentSource).toContain("Ready to start SOGP?");
    expect(contentSource).toContain('ctaHref: "/sogp"');
    expect(contentSource).toContain('"Level 1"');
    expect(contentSource).toContain('"Level 2"');
    expect(contentSource).toContain('"Level 3"');
    expect(contentSource).toContain("Gospel: The Word of Truth");
    expect(contentSource).toContain("Introduction to Doctrinal Summaries");
    expect(contentSource).toContain("The Truth on Morality");
    expect(contentSource).toContain("Spiritual Warfare");
    expect(contentSource).toContain("Commitment: How to Fulfil Purpose");
  });
});
