import { describe, expect, test } from "vitest";

import {
  fullnessLabel,
  fullnessRank,
  isFullnessMembership,
  matchesFullnessFilter,
} from "./fullness";

describe("Fullness tag helpers", () => {
  test("labels each state in sentence case", () => {
    expect(fullnessLabel("fullness")).toBe("Fullness");
    expect(fullnessLabel("non_fullness")).toBe("Non-Fullness");
    expect(fullnessLabel(null)).toBe("Not set");
  });

  test("filters by tag, including untagged enrollees", () => {
    expect(matchesFullnessFilter("fullness", "all")).toBe(true);
    expect(matchesFullnessFilter(null, "all")).toBe(true);
    expect(matchesFullnessFilter("fullness", "fullness")).toBe(true);
    expect(matchesFullnessFilter("non_fullness", "fullness")).toBe(false);
    expect(matchesFullnessFilter(null, "unset")).toBe(true);
    expect(matchesFullnessFilter("fullness", "unset")).toBe(false);
  });

  test("sorts Fullness first, then Non-Fullness, then not set", () => {
    const values = [null, "non_fullness", "fullness"] as const;
    expect([...values].sort((a, b) => fullnessRank(a) - fullnessRank(b))).toEqual([
      "fullness",
      "non_fullness",
      null,
    ]);
  });

  test("only accepts the two stored values", () => {
    expect(isFullnessMembership("fullness")).toBe(true);
    expect(isFullnessMembership("non_fullness")).toBe(true);
    expect(isFullnessMembership("Fullness")).toBe(false);
    expect(isFullnessMembership(null)).toBe(false);
  });
});
