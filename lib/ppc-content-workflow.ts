import type { CourseLevel } from "./student-course";

export type ContentLevelStatus = "draft" | "published";

export type ContentLevelItem = {
  level: CourseLevel;
  title: string;
  totalLessons: number;
  status: ContentLevelStatus;
  lastPublishedAt: string | null;
};

const TOTAL_LESSONS_BY_LEVEL: Record<CourseLevel, number> = {
  1: 5,
  2: 11,
  3: 30,
  4: 60,
  5: 300,
};

export function buildDemoContentLevels(): ContentLevelItem[] {
  return [1, 2, 3, 4, 5].map((level) => ({
    level: level as CourseLevel,
    title: `Level ${level}`,
    totalLessons: TOTAL_LESSONS_BY_LEVEL[level as CourseLevel],
    status: level === 1 ? "published" : "draft",
    lastPublishedAt: level === 1 ? "2026-03-01T10:00:00.000Z" : null,
  }));
}

export function publishLevelContent(
  levels: ContentLevelItem[],
  levelToPublish: CourseLevel,
  publishedAt: string,
): ContentLevelItem[] {
  return levels.map((level) => {
    if (level.level !== levelToPublish) {
      return level;
    }

    return {
      ...level,
      status: "published",
      lastPublishedAt: publishedAt,
    };
  });
}

export function setLevelDraft(
  levels: ContentLevelItem[],
  levelToDraft: CourseLevel,
): ContentLevelItem[] {
  return levels.map((level) => {
    if (level.level !== levelToDraft) {
      return level;
    }

    return {
      ...level,
      status: "draft",
      lastPublishedAt: null,
    };
  });
}

export function summarizeContentLevels(
  levels: ContentLevelItem[],
): {
  published: number;
  draft: number;
} {
  return levels.reduce(
    (summary, level) => {
      if (level.status === "published") {
        return {
          ...summary,
          published: summary.published + 1,
        };
      }

      return {
        ...summary,
        draft: summary.draft + 1,
      };
    },
    {
      published: 0,
      draft: 0,
    },
  );
}
