import { describe, expect, test } from "vitest";

import { sogpLandingContent } from "./landing-content";

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
});
