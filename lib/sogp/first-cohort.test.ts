import { describe, expect, test } from "vitest";

import { buildFirstCohortTrackSelection } from "./first-cohort";

describe("buildFirstCohortTrackSelection", () => {
  test("builds 20 days from all Level 1, all Level 2, and four Level 3 tracks", () => {
    const tracks = buildFirstCohortTrackSelection([4, 8, 10, 18]);

    expect(tracks).toHaveLength(20);
    expect(tracks.map((track) => track.dayNumber)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
    expect(tracks.slice(0, 5).every((track) => track.levelId === 1)).toBe(true);
    expect(tracks.slice(5, 16).every((track) => track.levelId === 2)).toBe(true);
    expect(tracks.slice(-4).map((track) => track.lessonNumber)).toEqual([
      4, 8, 10, 18,
    ]);
  });

  test("requires four unique positive Level 3 lesson numbers", () => {
    expect(() => buildFirstCohortTrackSelection([1, 2, 3])).toThrow(
      "Select exactly four Level 3 tracks.",
    );
    expect(() => buildFirstCohortTrackSelection([1, 1, 2, 3])).toThrow(
      "Level 3 track selections must be unique.",
    );
    expect(() => buildFirstCohortTrackSelection([0, 1, 2, 3])).toThrow(
      "Level 3 track numbers must be positive integers.",
    );
  });
});
