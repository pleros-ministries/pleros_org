export type SogpCurriculumLevel = 1 | 2 | 3 | 4;

export type SogpCurriculumTrack = {
  sourceLevelId: 1 | 2 | 3;
  sourceLessonNumber: number;
  title: string;
  curriculumLevel: SogpCurriculumLevel;
  curriculumOrder: number;
  levelPosition: number;
  isRequired: true;
};

export type SogpCurriculumLevelDefinition = {
  level: SogpCurriculumLevel;
  title: string;
  description: string;
  tracks: SogpCurriculumTrack[];
};

const levelDefinitions = [
  {
    level: 1,
    title: "Gospel foundations and the Spirit",
    description: "Foundational truth, discipline, and the baptism of the Holy Ghost.",
    sources: [
      [1, 1, "Gospel: The Word of Truth"],
      [1, 2, "God’s Purpose: Why We Exist"],
      [1, 3, "The New Creation: Who You Are in Christ"],
      [1, 4, "Faith Stand: How to Grow in Christ"],
      [3, 2, "Discipline – The Foundation of the Pursuit of Purpose"],
      [3, 1, "Baptism of the Holy Ghost"],
    ],
  },
  {
    level: 2,
    title: "Doctrinal foundations",
    description: "A clear doctrinal foundation for understanding God’s redemptive purpose.",
    sources: [
      [2, 1, "Introduction to Doctrinal Summaries"],
      [2, 2, "Bibliology"],
      [2, 3, "God and His Eternal Purpose"],
      [2, 4, "Biblical Origin and Ontology"],
      [2, 5, "Sin and Its Implication"],
      [2, 6, "God’s Wisdom Towards Redemption"],
    ],
  },
  {
    level: 3,
    title: "Redemption and lived faith",
    description: "Redemption, the Church, the new creation, and the walk of faith.",
    sources: [
      [2, 7, "Christology"],
      [2, 8, "Redemption"],
      [2, 9, "Church and Its Mission"],
      [2, 10, "Eschatology"],
      [2, 11, "The New Creation"],
      [3, 3, "The Walk of Faith"],
    ],
  },
  {
    level: 4,
    title: "Practical life and assignment",
    description: "Prayer, authority, healing, assignment, and supernatural life.",
    sources: [
      [3, 4, "The Life of Prayer"],
      [3, 5, "Believer’s Authority"],
      [3, 6, "Healing in the Newness of Life"],
      [3, 7, "Natural Assignment in the Newness of Life"],
      [3, 8, "Spiritual Assignment in the Newness of Life"],
      [3, 9, "Supernatural in the Newness of Life"],
    ],
  },
] as const;

export const SOGP_LEVELS: SogpCurriculumLevelDefinition[] =
  levelDefinitions.map((definition) => ({
    level: definition.level,
    title: definition.title,
    description: definition.description,
    tracks: definition.sources.map(
      ([sourceLevelId, sourceLessonNumber, title], index) => ({
        sourceLevelId,
        sourceLessonNumber,
        title,
        curriculumLevel: definition.level,
        curriculumOrder: (definition.level - 1) * 6 + index + 1,
        levelPosition: index + 1,
        isRequired: true,
      }),
    ),
  }));

export const SOGP_TRACKS = SOGP_LEVELS.flatMap((level) => level.tracks);

export function getSogpLevel(level: SogpCurriculumLevel) {
  const definition = SOGP_LEVELS.find((item) => item.level === level);
  if (!definition) throw new Error(`Unknown SOGP level ${level}.`);
  return definition;
}

export function validateSogpCurriculum(tracks: SogpCurriculumTrack[]) {
  const issues: string[] = [];
  if (tracks.length !== 24) {
    issues.push("SOGP curriculum must contain exactly 24 tracks.");
  }
  if (
    new Set(
      tracks.map(
        (track) => `${track.sourceLevelId}.${track.sourceLessonNumber}`,
      ),
    ).size !== tracks.length
  ) {
    issues.push("SOGP curriculum source coordinates must be unique.");
  }
  if (
    new Set(tracks.map((track) => track.curriculumOrder)).size !== tracks.length
  ) {
    issues.push("SOGP curriculum positions must be unique.");
  }
  return issues;
}
