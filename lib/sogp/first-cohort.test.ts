import { describe, expect, test } from "vitest";

import { buildFirstCohortTrackSelection } from "./first-cohort";

describe("buildFirstCohortTrackSelection", () => {
  test("builds 24 required tracks across four levels", () => {
    const tracks = buildFirstCohortTrackSelection();

    expect(tracks).toHaveLength(24);
    expect(tracks.map((track) => track.dayNumber)).toEqual(
      Array.from({ length: 24 }, (_, index) => index + 1),
    );
    expect(tracks.every((track) => track.isRequired)).toBe(true);
    expect(tracks.map((track) => track.curriculumLevel)).toEqual([
      1, 1, 1, 1, 1, 1,
      2, 2, 2, 2, 2, 2,
      3, 3, 3, 3, 3, 3,
      4, 4, 4, 4, 4, 4,
    ]);
    expect(tracks[4]).toMatchObject({
      levelId: 3,
      lessonNumber: 2,
      curriculumLevel: 1,
      dayNumber: 5,
      isRequired: true,
    });
    expect(tracks[5]).toMatchObject({
      levelId: 3,
      lessonNumber: 1,
      curriculumLevel: 1,
      dayNumber: 6,
    });
    expect(tracks[17]).toMatchObject({
      levelId: 3,
      lessonNumber: 3,
      curriculumLevel: 3,
      dayNumber: 18,
    });
  });
});
