import { describe, expect, test } from "vitest";

import { COMMUNITY_TOPICS, normaliseTopic, topicLabel } from "./topics";

describe("community topics", () => {
  test("normaliseTopic accepts known keys in any case", () => {
    expect(normaliseTopic("question")).toBe("question");
    expect(normaliseTopic("  Bible_Study ")).toBe("bible_study");
  });

  test("normaliseTopic rejects unknown or non-string values", () => {
    expect(normaliseTopic("politics")).toBeNull();
    expect(normaliseTopic("")).toBeNull();
    expect(normaliseTopic(null)).toBeNull();
    expect(normaliseTopic(7)).toBeNull();
  });

  test("topicLabel reads a stored key and tolerates stale ones", () => {
    expect(topicLabel("bible_study")).toBe("Bible study");
    expect(topicLabel("retired_topic")).toBeNull();
    expect(topicLabel(null)).toBeNull();
  });

  test("topic keys are unique", () => {
    const keys = COMMUNITY_TOPICS.map((topic) => topic.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
