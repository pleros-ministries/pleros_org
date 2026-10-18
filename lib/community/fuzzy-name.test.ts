import { describe, expect, it } from "vitest";

import { fuzzyNameScore } from "./fuzzy-name";

describe("fuzzyNameScore", () => {
  it("matches a first name, a surname or both in any order", () => {
    expect(fuzzyNameScore("ade", "Adedayo Adetona")).toBeGreaterThan(0);
    expect(fuzzyNameScore("adetona", "Adedayo Adetona")).toBeGreaterThan(0);
    expect(fuzzyNameScore("adetona adedayo", "Adedayo Adetona")).toBeGreaterThan(0);
  });

  it("forgives small typos", () => {
    expect(fuzzyNameScore("adedyo", "Adedayo Adetona")).toBeGreaterThan(0);
    expect(fuzzyNameScore("olanrewju", "Olanrewaju Adeniyi")).toBeGreaterThan(0);
    expect(fuzzyNameScore("tolu", "Toluwalase Olaniyi")).toBeGreaterThan(0);
  });

  it("finds a name from the middle of a word and ignores accents and case", () => {
    expect(fuzzyNameScore("wala", "Toluwalase Olaniyi")).toBeGreaterThan(0);
    expect(fuzzyNameScore("ADÉ", "Adedayo")).toBeGreaterThan(0);
  });

  it("needs every typed word to match", () => {
    expect(fuzzyNameScore("ade xyz", "Adedayo Adetona")).toBe(0);
    expect(fuzzyNameScore("gift", "Favour Bankole")).toBe(0);
  });

  it("ranks prefix matches above typo matches", () => {
    expect(fuzzyNameScore("ade", "Adedayo Adetona")).toBeGreaterThan(fuzzyNameScore("ade", "Kade Bello"));
    expect(fuzzyNameScore("favour", "Favour Bankole")).toBeGreaterThan(fuzzyNameScore("favor", "Favour Bankole"));
  });
});
