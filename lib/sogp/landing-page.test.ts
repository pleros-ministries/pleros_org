import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";

import {
  getSogpCurriculumLevels,
  sogpLandingContent,
} from "./landing-content";

describe("SOGP landing content", () => {
  test("covers the supplied launch copy", () => {
    expect(sogpLandingContent.hero.titleLines[0]).toContain("Find Truth");
    expect(sogpLandingContent.hero.ctaHref).toBe("/sogp/enrol");
    expect(sogpLandingContent.outcomes).toHaveLength(5);
    expect(sogpLandingContent.audiences).toHaveLength(7);
    expect(sogpLandingContent.structure.title).toBe("The structure of SOGP");
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
      {
        value: "level-3",
        label: "Level 3",
        numbers: [17, 18, 19],
      },
    ]);
  });

  test("keeps the landing page distraction-free and action-oriented", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "sogp", "sogp-landing-page.tsx"),
      "utf8",
    );

    expect(source).not.toContain("<HomepageNav");
    expect(source.match(/<SectionCta/g)?.length ?? 0).toBeGreaterThanOrEqual(12);
    expect(source).toContain("<SogpHeroPhone");
    const definitionSection = source.slice(
      source.indexOf("content.definition.title"),
      source.indexOf("Who should join SOGP?"),
    );
    expect(definitionSection.indexOf("content.outcomes.map")).toBeLessThan(
      definitionSection.indexOf('<SectionCta label={content.ctas.middle}'),
    );
  });
});
