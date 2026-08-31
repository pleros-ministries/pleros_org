import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  resolveWelcomeDashboardSections,
  welcomeDashboardSections,
} from "./welcome-dashboard-content";

describe("welcome dashboard content", () => {
  test("uses the approved eight-card order and destinations", () => {
    expect(
      welcomeDashboardSections.flatMap((section) =>
        section.cards.map((card) => card.title),
      ),
    ).toEqual([
      "Welcome Pack",
      "Pre-SOGP Lessons",
      "Podcast",
      "Devotion",
      "SOGP",
      "Advanced SOGP",
      "Community",
      "Partnership",
    ]);
    expect(welcomeDashboardSections[0]?.cards[0]?.href).toBe(
      "/dashboard/welcomepack",
    );
    expect(welcomeDashboardSections[1]?.cards[0]?.href).toBe(
      "/dashboard/podcast",
    );
    expect(welcomeDashboardSections[1]?.cards[1]?.href).toBe(
      "/dashboard/prayer-watch",
    );
    expect(welcomeDashboardSections[3]?.cards[1]?.href).toBe("/partner");
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

  test("gates SOGP journeys by enrolment and marks future products coming soon", () => {
    const locked = resolveWelcomeDashboardSections({
      isSogpEnrolled: false,
      startsAt: null,
      now: new Date("2026-09-01T12:00:00+01:00"),
    });
    expect(locked[0]?.cards[1]).toMatchObject({
      href: "/sogp/enrol",
      status: "enrolment_required",
    });
    expect(locked[2]?.cards[0]).toMatchObject({
      href: "/sogp/enrol",
      status: "enrolment_required",
    });
    expect(locked[2]?.cards[1]).toMatchObject({
      href: undefined,
      status: "coming_soon",
      statusLabel: "Coming soon",
    });
    expect(locked[3]?.cards[0]).toMatchObject({
      href: undefined,
      status: "coming_soon",
      statusLabel: "Coming soon",
    });
  });

  test("opens enrolled journeys and puts the SOGP countdown on its card", () => {
    const enrolled = resolveWelcomeDashboardSections({
      isSogpEnrolled: true,
      startsAt: new Date("2026-09-10T00:00:00+01:00"),
      now: new Date("2026-09-07T12:00:00+01:00"),
    });
    expect(enrolled[0]?.cards[1]).toMatchObject({
      href: "/dashboard/pre-sogp",
      status: "available",
    });
    expect(enrolled[2]?.cards[0]).toMatchObject({
      href: "/dashboard/sogp",
      status: "upcoming",
      statusLabel: "3 days until SOGP begins",
    });
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

    expect(source).toContain("Start with SOGP and keep the resources");
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
    expect(source).toContain("md:right-[-3rem] md:bottom-[-7.5rem]");
    expect(source).toContain("bg-[linear-gradient(135deg,rgba(5,20,128,0.2)_0%,rgba(5,20,128,0.12)_58%,rgba(5,20,128,0.06)_100%)]");
    expect(source).toContain("WebkitMaskImage");
    expect(source).toContain("Our church ministry");
    expect(source).toContain("text-[var(--color-text-strong)]");
    expect(source).not.toContain("text-[rgba(5,20,128,0.78)]");
    expect(source).toContain("grid max-w-[28rem] gap-3");
    expect(source).toContain("Fellowship with Fullness of Christ Church");
    expect(source).toContain('href="/fcc"');
    expect(source).toContain("Learn more");
    expect(source).toContain("<DashboardChurchMinistryStrip />");
  });
});
