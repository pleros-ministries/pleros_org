import type {
  SogpCohortStatus,
  SogpEnrollmentStatus,
  SogpLearnerState,
} from "./types";

export function deriveSogpLearnerState(input: {
  cohortStatus: Extract<SogpCohortStatus, "preparing" | "active" | "completed">;
  enrollmentStatus: SogpEnrollmentStatus;
}): SogpLearnerState {
  if (
    input.enrollmentStatus === "completed" ||
    input.enrollmentStatus === "withdrawn"
  ) {
    return input.enrollmentStatus;
  }

  if (input.cohortStatus === "completed") {
    return "carryover";
  }

  return input.cohortStatus;
}
