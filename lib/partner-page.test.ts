import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("partner page", () => {
  test("uses a dedicated public route and restores the legacy partnership sections", () => {
    const routePath = join(process.cwd(), "app", "(site)", "partner", "page.tsx");
    const viewPath = join(
      process.cwd(),
      "components",
      "home",
      "partner-page-view.tsx",
    );
    const contentPath = join(process.cwd(), "lib", "partner-page-content.ts");

    expect(existsSync(routePath)).toBe(true);
    expect(existsSync(viewPath)).toBe(true);
    expect(existsSync(contentPath)).toBe(true);

    const routeSource = readFileSync(routePath, "utf8");
    const viewSource = readFileSync(viewPath, "utf8");
    const contentSource = readFileSync(contentPath, "utf8");

    expect(routeSource).toContain("PartnerPageView");
    expect(viewSource).toContain("Why partner with Pleros");
    expect(viewSource).toContain("What your partnership makes possible");
    expect(viewSource).toContain("grid-cols-1");
    expect(viewSource).toContain("md:grid-cols-2");
    expect(contentSource).toContain("Advance the Gospel");
    expect(contentSource).toContain("Raise Disciples");
    expect(contentSource).toContain("Transform Communities");
    expect(contentSource).toContain("Expand Kingdom Impact");
    expect(contentSource).toContain("Become a partner today");
  });
});
