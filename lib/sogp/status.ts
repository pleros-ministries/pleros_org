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

/**
 * Whether to offer a signed-in learner an explicit "join another cohort"
 * action. Deliberately conservative: if any of their enrollments sits in a
 * cohort that hasn't finished, they're mid-program somewhere and this is
 * never offered — even if they also hold an older, completed enrollment.
 *
 * Note: this uses newest-enrollment-first ordering, same as
 * `getSogpDashboardData`. `sogp-journey.ts`'s `getEnrollmentCohort` instead
 * orders by earliest cohort start — that inconsistency predates this
 * function and isn't resolved here; don't add a third ordering elsewhere.
 */
export function canOfferJoinAnotherCohort(
  rows: Array<{
    enrollment: { cohortId: number };
    cohort: { status: SogpCohortStatus };
  }>,
  openCohortId: number | null,
): boolean {
  if (!openCohortId) return false;
  if (rows.some((row) => row.cohort.status !== "completed")) return false;
  return !rows.some((row) => row.enrollment.cohortId === openCohortId);
}
