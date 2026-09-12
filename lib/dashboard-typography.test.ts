import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("dashboard typography", () => {
  test("keeps the dashboard hero on the shared home page heading class, cards on the dashboard scale", () => {
    const dashboardSource = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-dashboard-view.tsx"),
      "utf8",
    );
    const welcomePackSource = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-pack-pages.tsx"),
      "utf8",
    );

    // The hero greeting still reuses the home page's display heading.
    expect(dashboardSource).toContain("site-hero-heading");
    // Cards are icon-led and intentionally use the dashboard-specific type
    // scale (defined in app/globals.css) rather than the marketing
    // site-pathway-title / site-section-heading classes.
    expect(dashboardSource).toContain("site-dashboard-card-title");
    expect(dashboardSource).toContain("site-dashboard-card-body");
    expect(dashboardSource).not.toContain("site-pathway-title");

    // Welcome Pack is a separate, untouched surface — still on the shared
    // marketing heading classes.
    expect(welcomePackSource).toContain("site-hero-heading");
    expect(welcomePackSource).toContain("site-section-heading");
  });

  test("uses Be Vietnam Pro explicitly for dashboard body copy", () => {
    const dashboardSource = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-dashboard-view.tsx"),
      "utf8",
    );

    expect(dashboardSource).toContain("font-[var(--font-be-vietnam-pro)]");
  });

  test("keeps dashboard card titles on the dashboard type scale", () => {
    const dashboardSource = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-dashboard-view.tsx"),
      "utf8",
    );

    expect(dashboardSource).toContain(
      "site-dashboard-card-title max-w-[16ch] text-[0.9rem]",
    );
  });
});
