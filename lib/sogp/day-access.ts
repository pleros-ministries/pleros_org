import type { SogpLearnerState } from "./types";
import type { SogpCurriculumLevel } from "./curriculum";
import { canAccessSogpTrack } from "./progression";

export function canAccessSogpDay(input: {
  learnerState: SogpLearnerState;
  now: Date;
  releaseAt: Date;
  curriculumLevel: SogpCurriculumLevel;
  previousLevelComplete: boolean;
  immediateStart?: boolean;
  lessonStatus?: "draft" | "published";
}) {
  if (input.learnerState === "withdrawn") return false;
  if (input.immediateStart) return input.lessonStatus === "published";
  return canAccessSogpTrack(input);
}
