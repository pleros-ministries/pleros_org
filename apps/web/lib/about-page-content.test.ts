import { describe, expect, test } from "vitest";

import {
  aboutPageBody,
  aboutPageHero,
  aboutPageLeadLines,
  aboutPageMinisterFollow,
} from "./about-page-content";

describe("about page content", () => {
  test("keeps the hero copy aligned with the figma frame", () => {
    expect(aboutPageHero.title).toBe("About Us");
    expect(aboutPageHero.description).toBe(
      "⁠Helping you fulfill God's purpose for your life.",
    );
  });

  test("preserves the three-line ministry statement and glossary emphasis", () => {
    expect(aboutPageLeadLines).toEqual([
      "Proclaiming the Truth",
      "Perfecting the Saints",
      "Fufilling God's Purpose",
    ]);

    expect(aboutPageBody[0]).toContain(
      "Pleros Ministries and Missions is the parent organisation of Fullness of Christ Church Global, Pleros DSS Mission and other ministries.",
    );
    expect(aboutPageBody[1]).toContain('"Pleros"');
    expect(aboutPageBody[1]).toContain("Pleroma");
    expect(aboutPageBody[1]).toContain("Pleres");
    expect(aboutPageBody[1]).toContain("Pleroo");
    expect(aboutPageBody[2]).toContain(
      "It reflects our vision to see the fullness of the world reached with the Gospel so they can fulfill God's purpose.",
    );
  });

  test("lists the Senior Minister's social links", () => {
    expect(aboutPageMinisterFollow.name).toBe("Akinwunmi Akinbile");
    expect(aboutPageMinisterFollow.handle).toBe("@akin_akinbile");
    expect(aboutPageMinisterFollow.links).toHaveLength(4);
    expect(aboutPageMinisterFollow.links.map((link) => link.label)).toEqual([
      "Instagram",
      "X",
      "TikTok",
      "Facebook",
    ]);
  });
});
