import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("dashboard typography", () => {
  test("reuses the home page heading classes for dashboard headings", () => {
    const dashboardSource = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-dashboard-view.tsx"),
      "utf8",
    );
    const welcomePackSource = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-pack-page.tsx"),
      "utf8",
    );

    expect(dashboardSource).toContain("site-hero-heading");
    expect(dashboardSource).toContain("site-section-heading");
    expect(dashboardSource).toContain("site-pathway-title");
    expect(welcomePackSource).toContain("site-hero-heading");
    expect(welcomePackSource).toContain("site-section-heading");
    expect(dashboardSource).not.toContain("site-dashboard-hero-heading");
    expect(dashboardSource).not.toContain("site-dashboard-section-heading");
    expect(dashboardSource).not.toContain("site-dashboard-card-title");
    expect(welcomePackSource).not.toContain("site-dashboard-hero-heading");
    expect(welcomePackSource).not.toContain("site-dashboard-section-heading");
  });

  test("uses Be Vietnam Pro explicitly for dashboard body copy", () => {
    const dashboardSource = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-dashboard-view.tsx"),
      "utf8",
    );

    expect(dashboardSource).toContain("font-[var(--font-be-vietnam-pro)]");
  });
});
