export type SogpTrackSelection = {
  levelId: 1 | 2 | 3;
  lessonNumber: number;
  dayNumber: number | null;
  weekNumber: number;
  curriculumLevel: 1 | 2 | 3;
  curriculumOrder: number;
  isRequired: boolean;
  liveSessionNumber: number | null;
};

export type FirstCohortSelectionInput = {
  disciplineLessonNumber: number;
  requiredPracticalLessonNumbers: number[];
  optionalPracticalLessonNumbers: number[];
};

const LEVEL_ONE_FOUNDATION_COUNT = 4;
const LEVEL_TWO_COUNT = 11;

export function buildFirstCohortTrackSelection(
  input: FirstCohortSelectionInput,
): SogpTrackSelection[] {
  if (input.requiredPracticalLessonNumbers.length !== 4) {
    throw new Error("Select exactly four required practical tracks.");
  }
  if (input.optionalPracticalLessonNumbers.length > 4) {
    throw new Error("Select no more than four optional practical tracks.");
  }

  const practicalLessonNumbers = [
    input.disciplineLessonNumber,
    ...input.requiredPracticalLessonNumbers,
    ...input.optionalPracticalLessonNumbers,
  ];
  if (new Set(practicalLessonNumbers).size !== practicalLessonNumbers.length) {
    throw new Error("Practical track selections must be unique.");
  }
  if (
    practicalLessonNumbers.some(
      (lessonNumber) => !Number.isInteger(lessonNumber) || lessonNumber <= 0,
    )
  ) {
    throw new Error("Practical track numbers must be positive integers.");
  }

  const requiredLessons: Array<{
    levelId: 1 | 2 | 3;
    lessonNumber: number;
    curriculumLevel: 1 | 2 | 3;
  }> = [
    ...Array.from({ length: LEVEL_ONE_FOUNDATION_COUNT }, (_, index) => ({
      levelId: 1 as const,
      lessonNumber: index + 1,
      curriculumLevel: 1 as const,
    })),
    {
      levelId: 3,
      lessonNumber: input.disciplineLessonNumber,
      curriculumLevel: 1,
    },
    ...Array.from({ length: LEVEL_TWO_COUNT }, (_, index) => ({
      levelId: 2 as const,
      lessonNumber: index + 1,
      curriculumLevel: 2 as const,
    })),
    ...input.requiredPracticalLessonNumbers.map((lessonNumber) => ({
      levelId: 3 as const,
      lessonNumber,
      curriculumLevel: 3 as const,
    })),
  ];

  const required = requiredLessons.map((lesson, index) => ({
    ...lesson,
    dayNumber: index + 1,
    weekNumber: Math.floor(index / 5) + 1,
    curriculumOrder: index + 1,
    isRequired: true,
    liveSessionNumber: null,
  }));
  const optional = input.optionalPracticalLessonNumbers.map(
    (lessonNumber, index) => ({
      levelId: 3 as const,
      lessonNumber,
      dayNumber: required.length + index + 1,
      weekNumber: index + 1,
      curriculumLevel: 3 as const,
      curriculumOrder: required.length + index + 1,
      isRequired: false,
      liveSessionNumber: index + 1,
    }),
  );

  return [...required, ...optional];
}
