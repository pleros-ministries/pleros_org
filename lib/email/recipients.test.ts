import { describe, expect, test } from "vitest";

import { chunk, uniqueRecipients } from "./recipients";

describe("uniqueRecipients", () => {
  test("trims, lower-cases and dedupes, keeping first-seen order", () => {
    expect(
      uniqueRecipients([" Admin@Pleros.org ", "super@pleros.org", "admin@pleros.org", "  "]),
    ).toEqual(["admin@pleros.org", "super@pleros.org"]);
  });

  test("is empty when there is no one", () => {
    expect(uniqueRecipients([])).toEqual([]);
  });
});

describe("chunk", () => {
  test("splits into batches of the given size", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 100)).toEqual([]);
  });
});
