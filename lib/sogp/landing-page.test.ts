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

  test("uses the supplied SOGP welcome video", () => {
    expect(sogpLandingContent.introVideo).toEqual({
      title: "What is the School of God’s Purpose?",
      description:
        "Watch this short introduction to the journey you are about to begin.",
      src: "/site/sogp/sogp-welcome-WaXgk9zqi78.mp4",
      posterSrc: "/site/sogp/sogp-welcome-WaXgk9zqi78.jpg",
    });
  });

  test("keeps structural document instructions out of visitor copy", () => {
    const serialized = JSON.stringify(sogpLandingContent);
    expect(serialized).not.toContain('"Visual"');
    expect(serialized).not.toContain('"Video"');
    expect(serialized).not.toContain('"Headline/Subheadline"');
  });

  test("groups 24 curriculum tracks into four six-track levels", () => {
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
        numbers: [1, 2, 3, 4, 5, 6],
      },
      {
        value: "level-2",
        label: "Level 2",
        numbers: [7, 8, 9, 10, 11, 12],
      },
      {
        value: "level-3",
        label: "Level 3",
        numbers: [13, 14, 15, 16, 17, 18],
      },
      {
        value: "level-4",
        label: "Level 4",
        numbers: [19, 20, 21, 22, 23, 24],
      },
    ]);
  });

  test("keeps the landing page distraction-free and action-oriented", () => {
    const source = readFileSync(
      join(process.cwd(), "components", "sogp", "sogp-landing-page.tsx"),
      "utf8",
    );

    expect(source).not.toContain("<HomepageNav");
    expect(source).toContain("prefetch={true}");
    expect(source).not.toContain("lg:whitespace-nowrap");
    expect(source).toContain("lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]");
    expect(source).toContain("lg:max-w-none");
    expect(source).toContain('className="grid min-w-0 gap-7"');
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
