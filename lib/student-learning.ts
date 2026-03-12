import type { CourseLevel } from "./student-course";

export type LessonOrderPolicy = "all_unlocked" | "strict_sequence";

export type LessonRequirementSignals = {
  audioListened: boolean;
  notesRead: boolean;
  quizPassed: boolean;
  writtenApproved: boolean;
};

export type LessonStatus = "not_started" | "in_progress" | "completed";

export type LessonPathItem = {
  lessonNumber: number;
  title: string;
  unlocked: boolean;
  status: LessonStatus;
  signals: LessonRequirementSignals;
};

export type BuildLessonPathInput = {
  lessonCount: number;
  orderPolicy: LessonOrderPolicy;
  completionByLesson: Partial<Record<number, LessonRequirementSignals>>;
};

export type LevelLearningSnapshot = {
  level: CourseLevel;
  lessonCount: number;
  orderPolicy: LessonOrderPolicy;
  progressPercent: number;
  canGraduate: boolean;
  lessonPath: LessonPathItem[];
  currentLessonNumber: number;
};

const LESSON_COUNTS_BY_LEVEL: Record<CourseLevel, number> = {
  1: 5,
  2: 11,
  3: 30,
  4: 60,
  5: 300,
};

const DEFAULT_SIGNALS: LessonRequirementSignals = {
  audioListened: false,
  notesRead: false,
  quizPassed: false,
  writtenApproved: false,
};

export function isLessonComplete(signals: LessonRequirementSignals): boolean {
  return (
    signals.audioListened &&
    signals.notesRead &&
    signals.quizPassed &&
    signals.writtenApproved
  );
}

export function calculateLevelProgress(lessonSignals: LessonRequirementSignals[]): number {
  if (lessonSignals.length === 0) {
    return 0;
  }

  const completedCount = lessonSignals.filter((signals) => isLessonComplete(signals)).length;
  return Math.round((completedCount / lessonSignals.length) * 100);
}

export function canGraduateLevel(lessonSignals: LessonRequirementSignals[]): boolean {
  if (lessonSignals.length === 0) {
    return false;
  }

  return lessonSignals.every((signals) => isLessonComplete(signals));
}

function resolveLessonStatus(signals: LessonRequirementSignals): LessonStatus {
  if (isLessonComplete(signals)) {
    return "completed";
  }

  if (Object.values(signals).some(Boolean)) {
    return "in_progress";
  }

  return "not_started";
}

export function buildLessonPath({
  lessonCount,
  orderPolicy,
  completionByLesson,
}: BuildLessonPathInput): LessonPathItem[] {
  const path: LessonPathItem[] = [];

  let lastStrictLessonIsComplete = true;

  for (let lessonNumber = 1; lessonNumber <= lessonCount; lessonNumber += 1) {
    const lessonSignals = completionByLesson[lessonNumber] ?? DEFAULT_SIGNALS;

    const unlocked =
      orderPolicy === "all_unlocked"
        ? true
        : lessonNumber === 1 || (lastStrictLessonIsComplete && path[lessonNumber - 2]?.unlocked === true);

    path.push({
      lessonNumber,
      title: `Lesson ${lessonNumber}`,
      unlocked,
      status: resolveLessonStatus(lessonSignals),
      signals: lessonSignals,
    });

    lastStrictLessonIsComplete = isLessonComplete(lessonSignals);
  }

  return path;
}

function resolveCurrentLessonNumber(lessonPath: LessonPathItem[]): number {
  const firstActionableLesson = lessonPath.find(
    (lesson) => lesson.unlocked && lesson.status !== "completed",
  );

  if (firstActionableLesson) {
    return firstActionableLesson.lessonNumber;
  }

  return lessonPath[lessonPath.length - 1]?.lessonNumber ?? 1;
}

export function buildDemoLevelLearningSnapshot(level: CourseLevel): LevelLearningSnapshot {
  const lessonCount = LESSON_COUNTS_BY_LEVEL[level];

  const demoCompletion: Partial<Record<number, LessonRequirementSignals>> =
    level === 1
      ? {
          1: {
            audioListened: true,
            notesRead: true,
            quizPassed: true,
            writtenApproved: true,
          },
          2: {
            audioListened: true,
            notesRead: true,
            quizPassed: true,
            writtenApproved: false,
          },
          3: {
            audioListened: false,
            notesRead: false,
            quizPassed: false,
            writtenApproved: false,
          },
        }
      : {};

  const lessonPath = buildLessonPath({
    lessonCount,
    orderPolicy: "all_unlocked",
    completionByLesson: demoCompletion,
  });

  const lessonSignals = lessonPath.map((lesson) => lesson.signals);

  return {
    level,
    lessonCount,
    orderPolicy: "all_unlocked",
    progressPercent: calculateLevelProgress(lessonSignals),
    canGraduate: canGraduateLevel(lessonSignals),
    lessonPath,
    currentLessonNumber: resolveCurrentLessonNumber(lessonPath),
  };
}
