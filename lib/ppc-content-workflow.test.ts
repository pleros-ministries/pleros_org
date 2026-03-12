import { describe, expect, test } from "vitest";

import {
  buildDemoContentLevels,
  publishLevelContent,
  setLevelDraft,
  summarizeContentLevels,
} from "./ppc-content-workflow";

describe("ppc content workflow", () => {
  test("builds all five fixed levels", () => {
    const levels = buildDemoContentLevels();

    expect(levels).toHaveLength(5);
    expect(levels.map((level) => level.level)).toEqual([1, 2, 3, 4, 5]);
  });

  test("publish sets level state and publication timestamp", () => {
    const levels = buildDemoContentLevels();
    const publishedAt = "2026-03-11T10:00:00.000Z";

    const next = publishLevelContent(levels, 3, publishedAt);
    const levelThree = next.find((level) => level.level === 3);

    expect(levelThree?.status).toBe("published");
    expect(levelThree?.lastPublishedAt).toBe(publishedAt);
  });

  test("setLevelDraft flips published level back to draft", () => {
    const levels = publishLevelContent(
      buildDemoContentLevels(),
      1,
      "2026-03-11T10:00:00.000Z",
    );

    const next = setLevelDraft(levels, 1);
    const levelOne = next.find((level) => level.level === 1);

    expect(levelOne?.status).toBe("draft");
    expect(levelOne?.lastPublishedAt).toBeNull();
  });

  test("summarize counts published and draft levels", () => {
    const levels = publishLevelContent(
      publishLevelContent(buildDemoContentLevels(), 1, "2026-03-11T10:00:00.000Z"),
      2,
      "2026-03-11T11:00:00.000Z",
    );

    expect(summarizeContentLevels(levels)).toEqual({
      published: 2,
      draft: 3,
    });
  });
});
