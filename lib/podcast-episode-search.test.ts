import { describe, expect, it } from "vitest";

import { dedupeEpisodes, normaliseEpisodeText, searchEpisodes } from "./podcast-episode-search";

const list = [
  { guid: "a", title: "Walk of Faith (Part 1)" },
  { guid: "b", title: "Walk of Faith (Part 2)" },
  { guid: "b", title: "Walk of Faith (Part 2)" },
  { guid: "c", title: "walk of faith — part 2" },
  { guid: "d", title: "Faith that works" },
  { guid: "e", title: "Grâce and truth" },
];

describe("podcast episode search", () => {
  it("normalises case, accents and punctuation", () => {
    expect(normaliseEpisodeText("  Grâce,  and   TRUTH! ")).toBe("grace and truth");
  });

  it("keeps one row per guid and per title", () => {
    expect(dedupeEpisodes(list).map(row => row.guid)).toEqual(["a", "b", "d", "e"]);
  });

  it("needs every word and ranks the phrase at the start first", () => {
    const rows = dedupeEpisodes(list);
    expect(searchEpisodes(rows, "faith part 2").map(row => row.guid)).toEqual(["b"]);
    expect(searchEpisodes(rows, "faith").map(row => row.guid)).toEqual(["d", "a", "b"]);
    expect(searchEpisodes(rows, "grace").map(row => row.guid)).toEqual(["e"]);
  });

  it("returns nothing for an empty or punctuation-only query", () => {
    expect(searchEpisodes(list, "  —  ")).toEqual([]);
  });
});
