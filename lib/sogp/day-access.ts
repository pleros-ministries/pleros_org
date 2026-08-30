import type { SogpLearnerState } from "./types";
import type { SogpCurriculumLevel } from "./curriculum";
import { canAccessSogpTrack } from "./progression";

export function canAccessSogpDay(input: {
  learnerState: SogpLearnerState;
  now: Date;
  releaseAt: Date;
  curriculumLevel: SogpCurriculumLevel;
  previousLevelComplete: boolean;
}) {
  if (input.learnerState === "withdrawn") return false;
  return canAccessSogpTrack(input);
}
