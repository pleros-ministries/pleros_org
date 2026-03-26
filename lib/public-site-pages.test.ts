import { describe, expect, test } from "vitest";

import { getPublicSitePage, publicSitePages } from "./public-site-pages";

describe("public site pages", () => {
  test("defines the restored homepage destination routes", () => {
    expect(publicSitePages.map((page) => page.slug)).toEqual([
      "questions",
      "purpose",
      "fulfil",
      "podcast",
      "library",
    ]);
  });

  test("returns page content for known slugs and rejects unrelated routes", () => {
    expect(getPublicSitePage("questions")?.title).toBe("Explore Questions");
    expect(getPublicSitePage("style-demo")).toBeNull();
  });
});
