import { SOGP_TRACKS, type SogpCurriculumLevel } from "./curriculum";

export type SogpTrackSelection = {
  levelId: 1 | 2 | 3;
  lessonNumber: number;
  dayNumber: number;
  weekNumber: SogpCurriculumLevel;
  curriculumLevel: SogpCurriculumLevel;
  curriculumOrder: number;
  isRequired: true;
  liveSessionNumber: null;
};

export function buildFirstCohortTrackSelection(): SogpTrackSelection[] {
  return SOGP_TRACKS.map((track) => ({
    levelId: track.sourceLevelId,
    lessonNumber: track.sourceLessonNumber,
    dayNumber: track.curriculumOrder,
    weekNumber: track.curriculumLevel,
    curriculumLevel: track.curriculumLevel,
    curriculumOrder: track.curriculumOrder,
    isRequired: true,
    liveSessionNumber: null,
  }));
}
