import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

describe("vision and mission page", () => {
  test("uses a dedicated route and links to it from the about page", () => {
    const routePath = join(
      process.cwd(),
      "app",
      "(site)",
      "vision-and-mission",
      "page.tsx",
    );
    const viewPath = join(
      process.cwd(),
      "components",
      "home",
      "vision-mission-page-view.tsx",
    );
    const contentPath = join(
      process.cwd(),
      "lib",
      "vision-mission-page-content.ts",
    );
    const aboutViewPath = join(
      process.cwd(),
      "components",
      "home",
      "about-page-view.tsx",
    );

    expect(existsSync(routePath)).toBe(true);
    expect(existsSync(viewPath)).toBe(true);
    expect(existsSync(contentPath)).toBe(true);

    const routeSource = readFileSync(routePath, "utf8");
    const contentSource = readFileSync(contentPath, "utf8");
    const aboutViewSource = readFileSync(aboutViewPath, "utf8");

    expect(routeSource).toContain("VisionMissionPageView");
    expect(contentSource).toContain("What we are sent to do");
    expect(contentSource).toContain("Our Vision & Mission");
    expect(contentSource).toContain("bg-[#5bd2df]");
    expect(contentSource).toContain("bg-[var(--color-brand-lime)]");
    expect(contentSource).toContain("We see all humans reached");
    expect(contentSource).toContain("To reach all humans across all generations");
    expect(aboutViewSource).toContain("/vision-and-mission");
    expect(aboutViewSource).toContain("Vision & Mission");
  });
});
