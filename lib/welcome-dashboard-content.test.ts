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
    // Community (index 6) is gated by enrolment, not "coming soon".
    expect(locked[3]?.cards[0]).toMatchObject({
      href: undefined,
      status: "enrolment_required",
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
    expect(enrolled[3]?.cards[0]).toMatchObject({
      href: "/dashboard/community",
      status: "available",
    });
  });

  test("keeps a dedicated welcome pack route under the dashboard", () => {
    const source = readFileSync(
      join(process.cwd(), "app", "(site)", "dashboard", "welcomepack", "page.tsx"),
      "utf8",
    );

    expect(source).toContain("WelcomePackPage");
  });

  test("keeps the dashboard home compact, with no explanatory hero copy", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-dashboard-view.tsx"),
      "utf8",
    );

    expect(source).not.toContain("Start with SOGP and keep the resources");
    expect(source).not.toContain("Your resources are gathered here and tied to");
    expect(source).toContain("text-[21px]");
    expect(source).toContain("<InstallAppCta />");
  });

  test("keeps a compact church ministry link on the dashboard home", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "dashboard", "welcome-dashboard-view.tsx"),
      "utf8",
    );

    expect(source).toContain("Fullness of Christ Church");
    expect(source).toContain('href={resolveHref("/fcc")}');
  });
});


test("community access is independent of SOGP enrolment for an assigned pastor", () => {
  const cards = resolveWelcomeDashboardSections({ isSogpEnrolled: false, communityAccess: true, startsAt: null }).flatMap((section) => section.cards);
  expect(cards.find((card) => card.id === "community")).toMatchObject({ href: "/dashboard/community", status: "available" });
  expect(cards.find((card) => card.id === "sogp")).toMatchObject({ status: "enrolment_required" });
});
