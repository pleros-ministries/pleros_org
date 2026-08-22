import type { SogpLearnerState } from "./types";

export function canAccessSogpDay(input: {
  learnerState: SogpLearnerState;
  now: Date;
  releaseAt: Date;
}) {
  if (input.learnerState === "withdrawn") return false;
  return input.releaseAt.getTime() <= input.now.getTime();
}
