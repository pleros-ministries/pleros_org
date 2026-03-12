export type CourseLevel = 1 | 2 | 3 | 4 | 5;

export type StudentCourseSnapshot = {
  level: CourseLevel;
  courseTitle: string;
  progressPercent: number;
  currentLessonLabel: string;
};

export type CourseRailItem = {
  level: CourseLevel;
  title: string;
  lessons: number;
  state: "current" | "completed" | "locked";
  locked: boolean;
};

const LESSONS_PER_LEVEL: Record<CourseLevel, number> = {
  1: 5,
  2: 11,
  3: 30,
  4: 60,
  5: 300,
};

export function buildDefaultStudentCourse(): StudentCourseSnapshot {
  return {
    level: 1,
    courseTitle: "Level 1 Perfecting Course",
    progressPercent: 0,
    currentLessonLabel: "Lesson 1",
  };
}

export function buildCourseRail(currentLevel: CourseLevel): CourseRailItem[] {
  const levels: CourseLevel[] = [1, 2, 3, 4, 5];

  return levels.map((level) => {
    if (level > currentLevel) {
      return {
        level,
        title: `Level ${level}`,
        lessons: LESSONS_PER_LEVEL[level],
        state: "locked",
        locked: true,
      };
    }

    if (level === currentLevel) {
      return {
        level,
        title: `Level ${level}`,
        lessons: LESSONS_PER_LEVEL[level],
        state: "current",
        locked: false,
      };
    }

    return {
      level,
      title: `Level ${level}`,
      lessons: LESSONS_PER_LEVEL[level],
      state: "completed",
      locked: false,
    };
  });
}
