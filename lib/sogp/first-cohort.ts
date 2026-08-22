export type SogpTrackSelection = {
  levelId: 1 | 2 | 3;
  lessonNumber: number;
  dayNumber: number;
  weekNumber: number;
};

const LEVEL_ONE_COUNT = 5;
const LEVEL_TWO_COUNT = 11;

export function buildFirstCohortTrackSelection(
  levelThreeLessonNumbers: number[],
): SogpTrackSelection[] {
  if (levelThreeLessonNumbers.length !== 4) {
    throw new Error("Select exactly four Level 3 tracks.");
  }

  if (new Set(levelThreeLessonNumbers).size !== levelThreeLessonNumbers.length) {
    throw new Error("Level 3 track selections must be unique.");
  }

  if (
    levelThreeLessonNumbers.some(
      (lessonNumber) => !Number.isInteger(lessonNumber) || lessonNumber <= 0,
    )
  ) {
    throw new Error("Level 3 track numbers must be positive integers.");
  }

  const lessons = [
    ...Array.from({ length: LEVEL_ONE_COUNT }, (_, index) => ({
      levelId: 1 as const,
      lessonNumber: index + 1,
    })),
    ...Array.from({ length: LEVEL_TWO_COUNT }, (_, index) => ({
      levelId: 2 as const,
      lessonNumber: index + 1,
    })),
    ...levelThreeLessonNumbers.map((lessonNumber) => ({
      levelId: 3 as const,
      lessonNumber,
    })),
  ];

  return lessons.map((lesson, index) => ({
    ...lesson,
    dayNumber: index + 1,
    weekNumber: Math.floor(index / 5) + 1,
  }));
}
