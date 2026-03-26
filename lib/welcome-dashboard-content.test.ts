import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { welcomeDashboardSections } from "./welcome-dashboard-content";

describe("welcome dashboard content", () => {
  test("starts with a start here section and links the welcome pack card to its route", () => {
    expect(welcomeDashboardSections[0]?.title).toBe("Start Here");
    expect(welcomeDashboardSections[0]?.cards).toHaveLength(2);
    expect(welcomeDashboardSections[0]?.cards[0]?.title).toBe("Your Welcome Pack");
    expect(welcomeDashboardSections[0]?.cards[0]?.href).toBe("/dashboard/welcomepack");
    expect(welcomeDashboardSections[0]?.cards[1]?.title).toBe("Join Online Community");
  });

  test("defines four two-card dashboard sections matching the mobile frame", () => {
    expect(welcomeDashboardSections.map((section) => section.title)).toEqual([
      "Start Here",
      "Your Devotion",
      "Your Training",
      "Your Commitment",
    ]);

    expect(welcomeDashboardSections.every((section) => section.cards.length === 2)).toBe(true);
  });

  test("keeps a dedicated welcome pack route under the dashboard", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "(site)", "dashboard", "welcomepack", "page.tsx"),
      "utf8",
    );

    expect(source).toContain("WelcomePackPage");
  });

  test("uses the updated resource-hub intro copy on the dashboard home", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-dashboard-view.tsx"),
      "utf8",
    );

    expect(source).toContain("Access all our resources here and get started right away.");
    expect(source).not.toContain("Your resources are gathered here and tied to");
  });
});
