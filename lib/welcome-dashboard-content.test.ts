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
    expect(welcomeDashboardSections[0]?.cards[1]?.title).toBe("Your Discipleship Journey");
    expect(welcomeDashboardSections[0]?.cards[1]?.href).toBe(
      "/dashboard/discipleship-journey",
    );
  });

  test("links devotion and training cards to their destinations", () => {
    const devotion = welcomeDashboardSections.find((section) => section.id === "devotion");
    const training = welcomeDashboardSections.find((section) => section.id === "training");
    const commitment = welcomeDashboardSections.find((section) => section.id === "commitment");

    expect(devotion?.cards[0]?.href).toBe("/dashboard/prayer-watch");
    expect(devotion?.cards[1]?.href).toBe("/dashboard/podcast");
    expect(training?.cards[0]?.href).toBe("/ppc");
    expect(training?.cards[1]?.href).toBe("/dashboard/school-of-purpose");
    expect(commitment?.cards.find((card) => card.id === "assignments")?.href).toBeUndefined();
    expect(commitment?.cards.find((card) => card.id === "partnership")?.href).toBe(
      "/partner",
    );
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

    expect(source).toContain("Start with the welcome pack and other resources.");
    expect(source).not.toContain("Your resources are gathered here and tied to");
  });

  test("adds a church ministry strip above the dashboard footer", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-dashboard-view.tsx"),
      "utf8",
    );

    expect(source).toContain("DashboardChurchMinistryStrip");
    expect(source).toContain("bg-[linear-gradient(180deg,#f4fcff_0%,#dff5ff_100%)]");
    expect(source).toContain("py-14");
    expect(source).toContain("gap-6 sm:gap-7");
    expect(source).toContain("/site/home/assets/pathway-card-headers/church-card-header.svg");
    expect(source).toContain("right-[-5rem] bottom-[-3.5rem]");
    expect(source).toContain("opacity-[0.18]");
    expect(source).toContain("Our church ministry");
    expect(source).toContain("text-[var(--color-text-strong)]");
    expect(source).not.toContain("text-[rgba(5,20,128,0.78)]");
    expect(source).toContain("Fellowship with Fullness of Christ Church");
    expect(source).toContain('href="/fcc"');
    expect(source).toContain("Learn more");
    expect(source).toContain("<DashboardChurchMinistryStrip />");
  });
});
