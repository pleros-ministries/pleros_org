import { describe, expect, test } from "vitest";

import {
  aboutPageBody,
  aboutPageHero,
  aboutPageLeadLines,
} from "./about-page-content";

describe("about page content", () => {
  test("keeps the hero copy aligned with the figma frame", () => {
    expect(aboutPageHero.title).toBe("About Us");
    expect(aboutPageHero.description).toBe(
      "Discover who you were created to be",
    );
  });

  test("preserves the three-line ministry statement and glossary emphasis", () => {
    expect(aboutPageLeadLines).toEqual([
      "Building Disciples.",
      "Discovering Purpose",
      "Encountering God.",
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
});
