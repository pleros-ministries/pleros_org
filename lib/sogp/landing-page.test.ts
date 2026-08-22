import { describe, expect, test } from "vitest";

import { sogpLandingContent } from "./landing-content";

describe("SOGP landing content", () => {
  test("covers the supplied launch copy", () => {
    expect(sogpLandingContent.hero.title).toContain("Find truth");
    expect(sogpLandingContent.hero.ctaHref).toBe("/sogp/enroll");
    expect(sogpLandingContent.outcomes).toHaveLength(5);
    expect(sogpLandingContent.audiences.length).toBeGreaterThanOrEqual(7);
    expect(sogpLandingContent.structure).toMatchObject({
      durationDays: 28,
      trackCount: 20,
      liveClassCount: 4,
    });
    expect(sogpLandingContent.tools.map((tool) => tool.name)).toEqual([
      "Telegram",
      "Pleros Dashboard",
    ]);
  });

  test("does not claim complete privacy through Telegram", () => {
    const serialized = JSON.stringify(sogpLandingContent).toLowerCase();
    expect(serialized).not.toContain("stay private through the entire process");
  });
});
