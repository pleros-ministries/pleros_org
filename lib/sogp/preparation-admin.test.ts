import { describe, expect, test } from "vitest";

import { normalizeSogpPreparationInput } from "./preparation-admin";

describe("SOGP preparation authoring", () => {
  test("normalises a valid day and orders resources", () => {
    expect(
      normalizeSogpPreparationInput({
        cohortId: 4,
        publishDate: "2026-09-01",
        countdownLabel: "12 days until SOGP",
        introduction: " Here are your preparatory materials for today. ",
        resources: [
          { type: "video", title: "Watch", url: "https://youtube.com/watch?v=1" },
          { type: "reading", title: "Read", url: "/purpose" },
        ],
      }),
    ).toMatchObject({
      cohortId: 4,
      publishDate: "2026-09-01",
      introduction: "Here are your preparatory materials for today.",
      resources: [{ sortOrder: 0 }, { sortOrder: 1 }],
    });
  });

  test("rejects malformed dates, empty content and unsafe links", () => {
    expect(() =>
      normalizeSogpPreparationInput({
        cohortId: 0,
        publishDate: "tomorrow",
        countdownLabel: "",
        introduction: "",
        resources: [
          { type: "video", title: "Watch", url: "http://example.com/video" },
        ],
      }),
    ).toThrow("Choose a valid cohort");
  });
});
