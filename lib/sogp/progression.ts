import type { SogpCurriculumLevel } from "./curriculum";

const TRACKS_PER_LEVEL = 6;
const WEEK_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1_000;

export type SogpLevelStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "complete";

export type SogpLevelSummary = {
  level: SogpCurriculumLevel;
  status: SogpLevelStatus;
  completed: number;
  total: number;
  unlocksAt: Date;
};

export function canAccessSogpTrack(input: {
  releaseAt: Date;
  curriculumLevel: SogpCurriculumLevel;
  previousLevelComplete: boolean;
  now: Date;
}) {
  const isReleased = input.releaseAt.getTime() <= input.now.getTime();
  const prerequisiteMet =
    input.curriculumLevel === 1 || input.previousLevelComplete;
  return isReleased && prerequisiteMet;
}

export function summarizeSogpLevels(input: {
  tracks: Array<{
    curriculumLevel: number;
    assessmentComplete: boolean;
  }>;
  startsAt: Date;
  now: Date;
}): SogpLevelSummary[] {
  const summaries: SogpLevelSummary[] = [];

  for (const level of [1, 2, 3, 4] as const) {
    const levelTracks = input.tracks.filter(
      (track) => track.curriculumLevel === level,
    );
    const completed = levelTracks.filter(
      (track) => track.assessmentComplete,
    ).length;
    const unlocksAt = new Date(
      input.startsAt.getTime() + (level - 1) * WEEK_IN_MILLISECONDS,
    );
    const previousLevelComplete =
      level === 1 || summaries[level - 2]?.status === "complete";

    let status: SogpLevelStatus;
    if (completed === TRACKS_PER_LEVEL) status = "complete";
    else if (
      input.now.getTime() < unlocksAt.getTime() ||
      !previousLevelComplete
    ) {
      status = "locked";
    } else if (completed > 0) status = "in_progress";
    else status = "available";

    summaries.push({
      level,
      status,
      completed,
      total: TRACKS_PER_LEVEL,
      unlocksAt,
    });
  }

  return summaries;
}
