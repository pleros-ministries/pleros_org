import { describe, expect, test } from "vitest";

import {
  getSogpCurriculumLevels,
  sogpLandingContent,
} from "./landing-content";

describe("SOGP landing content", () => {
  test("covers the supplied launch copy", () => {
    expect(sogpLandingContent.hero.title).toContain("Find Truth");
    expect(sogpLandingContent.hero.ctaHref).toBe("/sogp/enroll");
    expect(sogpLandingContent.outcomes).toHaveLength(5);
    expect(sogpLandingContent.audiences).toHaveLength(7);
    expect(sogpLandingContent.structure.title).toBe("The Structure of SOGP");
    expect(sogpLandingContent.tools.items).toHaveLength(2);
  });

  test("keeps structural document instructions out of visitor copy", () => {
    const serialized = JSON.stringify(sogpLandingContent);
    expect(serialized).not.toContain('"Visual"');
    expect(serialized).not.toContain('"Video"');
    expect(serialized).not.toContain('"Headline/Subheadline"');
  });

  test("groups curriculum tracks into collapsible levels without resetting numbering", () => {
    const levels = getSogpCurriculumLevels();

    expect(
      levels.map((level) => ({
        value: level.value,
        label: level.label,
        numbers: level.tracks.map((track) => track.number),
      })),
    ).toEqual([
      {
        value: "level-1",
        label: "Level 1",
        numbers: [1, 2, 3, 4, 5],
      },
      {
        value: "level-2",
        label: "Level 2",
        numbers: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
      },
    ]);
  });
});
