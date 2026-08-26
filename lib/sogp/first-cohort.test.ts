import { describe, expect, test } from "vitest";

import { buildFirstCohortTrackSelection } from "./first-cohort";

describe("buildFirstCohortTrackSelection", () => {
  test("builds 20 required days and up to four optional practical tracks", () => {
    const tracks = buildFirstCohortTrackSelection({
      disciplineLessonNumber: 2,
      requiredPracticalLessonNumbers: [4, 8, 10, 18],
      optionalPracticalLessonNumbers: [3, 5, 6, 7],
    });

    expect(tracks).toHaveLength(24);
    expect(tracks.filter((track) => track.isRequired).map((track) => track.dayNumber)).toEqual(
      Array.from({ length: 20 }, (_, index) => index + 1),
    );
    expect(tracks.slice(0, 4).every((track) => track.levelId === 1)).toBe(true);
    expect(tracks[4]).toMatchObject({
      levelId: 3,
      lessonNumber: 2,
      curriculumLevel: 1,
      dayNumber: 5,
      isRequired: true,
    });
    expect(tracks.slice(5, 16).every((track) => track.levelId === 2)).toBe(true);
    expect(tracks.slice(16, 20).map((track) => track.lessonNumber)).toEqual([
      4, 8, 10, 18,
    ]);
    expect(tracks.slice(20)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ dayNumber: 21, curriculumLevel: 3, isRequired: false, liveSessionNumber: 1 }),
        expect.objectContaining({ dayNumber: 24, curriculumLevel: 3, isRequired: false, liveSessionNumber: 4 }),
      ]),
    );
  });

  test("requires four unique required and at most four optional practical tracks", () => {
    expect(() => buildFirstCohortTrackSelection({ disciplineLessonNumber: 1, requiredPracticalLessonNumbers: [2, 3, 4], optionalPracticalLessonNumbers: [] })).toThrow(
      "Select exactly four required practical tracks.",
    );
    expect(() => buildFirstCohortTrackSelection({ disciplineLessonNumber: 1, requiredPracticalLessonNumbers: [2, 3, 4, 5], optionalPracticalLessonNumbers: [6, 7, 8, 9, 10] })).toThrow(
      "Select no more than four optional practical tracks.",
    );
    expect(() => buildFirstCohortTrackSelection({ disciplineLessonNumber: 1, requiredPracticalLessonNumbers: [1, 2, 3, 4], optionalPracticalLessonNumbers: [] })).toThrow(
      "Practical track selections must be unique.",
    );
  });
});
