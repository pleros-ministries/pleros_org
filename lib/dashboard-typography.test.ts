import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("dashboard typography", () => {
  test("uses the compact greeting and card scale on the dashboard home", () => {
    const dashboardSource = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-dashboard-view.tsx"),
      "utf8",
    );
    const welcomePackSource = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-pack-pages.tsx"),
      "utf8",
    );

    // A compact greeting, not the marketing display heading.
    expect(dashboardSource).toContain("text-[21px]");
    expect(dashboardSource).not.toContain("site-hero-heading");
    // Card titles stay at or under 15px.
    expect(dashboardSource).toContain("text-[14px] font-medium");
    expect(dashboardSource).not.toContain("site-pathway-title");

    // Welcome Pack is a separate, untouched surface — still on the shared
    // marketing heading classes.
    expect(welcomePackSource).toContain("site-hero-heading");
    expect(welcomePackSource).toContain("site-section-heading");
  });

  test("uses Be Vietnam Pro explicitly for the dashboard home and shell", () => {
    const dashboardSource = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-dashboard-view.tsx"),
      "utf8",
    );
    const shellSource = readFileSync(
      join(process.cwd(), "components", "dashboard", "shell", "dashboard-shell.tsx"),
      "utf8",
    );

    expect(dashboardSource).toContain("font-[family-name:var(--font-be-vietnam-pro)]");
    expect(shellSource).toContain("font-[family-name:var(--font-be-vietnam-pro)]");
  });
});
