type LevelSummary = {
  id: number;
  title: string;
};

type NextLessonSummary = {
  id: number;
  lessonNumber: number;
  title: string;
};

type DashboardFocusInput = {
  currentLevelId: number;
  completedLessons: number;
  totalLessons: number;
  nextLesson: NextLessonSummary | null;
};

type LessonCompletionInput = {
  audioListened: boolean;
  notesRead: boolean;
  quizPassed: boolean;
  writtenApproved: boolean;
};

export function getCurrentLevelId(
  graduatedLevelIds: number[],
  totalLevels: number,
) {
  if (graduatedLevelIds.length === 0) {
    return 1;
  }

  return Math.min(Math.max(...graduatedLevelIds) + 1, totalLevels);
}

export function getLevelJourneyRows(
  levels: LevelSummary[],
  graduatedLevelIds: Set<number>,
  currentLevelId: number,
) {
  return levels.map((level) => {
    if (graduatedLevelIds.has(level.id)) {
      return {
        ...level,
        state: "graduated" as const,
        href: `/ppc/student/level/${level.id}`,
        statusLabel: "Graduated",
      };
    }

    if (level.id === currentLevelId) {
      return {
        ...level,
        state: "current" as const,
        href: `/ppc/student/level/${level.id}`,
        statusLabel: "Current level",
      };
    }

    return {
      ...level,
      state: "locked" as const,
      href: null,
      statusLabel: "Locked",
    };
  });
}

export function getDashboardFocus(input: DashboardFocusInput) {
  if (input.nextLesson) {
    return {
      eyebrow: "Current focus",
      title: `Continue lesson ${input.nextLesson.lessonNumber}`,
      description: input.nextLesson.title,
      ctaLabel: "Continue learning",
      ctaHref: `/ppc/student/level/${input.currentLevelId}/lesson/${input.nextLesson.id}`,
    };
  }

  return {
    eyebrow: "Current focus",
    title: `Level ${input.currentLevelId} complete`,
    description:
      "All lessons are finished. Staff graduation review is the next step.",
    ctaLabel: "Review this level",
    ctaHref: `/ppc/student/level/${input.currentLevelId}`,
  };
}

export function getLessonCompletionState(input: LessonCompletionInput) {
  const completed =
    input.audioListened &&
    input.notesRead &&
    input.quizPassed &&
    input.writtenApproved;

  if (completed) {
    return {
      label: "Complete",
      variant: "success" as const,
    };
  }

  const started =
    input.audioListened ||
    input.notesRead ||
    input.quizPassed ||
    input.writtenApproved;

  if (started) {
    return {
      label: "In progress",
      variant: "warning" as const,
    };
  }

  return {
    label: "Not started",
    variant: "default" as const,
  };
}
