import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("fulfil page", () => {
  test("uses a dedicated route and points visitors into PPC as the next step", () => {
    const routePath = join(process.cwd(), "app", "(site)", "fulfil", "page.tsx");
    const viewPath = join(
      process.cwd(),
      "components",
      "home",
      "fulfil-page-view.tsx",
    );
    const contentPath = join(process.cwd(), "lib", "fulfil-page-content.ts");

    expect(existsSync(routePath)).toBe(true);
    expect(existsSync(viewPath)).toBe(true);
    expect(existsSync(contentPath)).toBe(true);

    const routeSource = readFileSync(routePath, "utf8");
    const viewSource = readFileSync(viewPath, "utf8");
    const contentSource = readFileSync(contentPath, "utf8");

    expect(routeSource).toContain("FulfilPageView");
    expect(viewSource).toContain("HomepageNav");
    expect(viewSource).toContain("HomepageCommunitySection");
    expect(viewSource).toContain("HomepageFooter");
    expect(viewSource).toContain("How fulfilment takes shape");
    expect(viewSource).toContain("PPC is where this pathway becomes more deliberate");
    expect(contentSource).toContain("Grow into the life God is calling you to live");
    expect(contentSource).toContain("Purpose becomes clearer");
    expect(contentSource).toContain("Ready to keep growing?");
    expect(contentSource).toContain('primaryCtaHref: "/ppc"');
    expect(contentSource).toContain("Structured teaching");
    expect(contentSource).toContain("Steady spiritual rhythm");
  });
});
