/**
 * Staff moving an enrolment into the cohort that is currently getting ready
 * (see `getCohortMoveTarget`). Each enrollee is asked first, and the answer
 * is tracked per target cohort; the move itself changes the enrolment's
 * cohort in place.
 */
export type CohortMoveStatus = "asked" | "declined" | "moved";

/** What staff can record by hand; "moved" only ever comes from the move itself. */
export type CohortMoveResponse = Exclude<CohortMoveStatus, "moved">;

export type CohortMoveState = {
  status: CohortMoveStatus;
  /** When they were asked, or when they declined / were moved. */
  at: string;
  /** The cohort they were in when asked — where a moved enrolment came from. */
  fromCohortTitle: string;
};

export type CohortMoveTarget = {
  id: number;
  title: string;
  startsAt: string;
  /** Cohort start and end dates in Lagos time, ready to show. */
  datesLabel: string;
};

export type CohortMoveFilter = "all" | "not_asked" | CohortMoveStatus;

export const COHORT_MOVE_FILTER_OPTIONS: Array<{ value: CohortMoveFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "not_asked", label: "Not asked" },
  { value: "asked", label: "Asked" },
  { value: "declined", label: "Declined" },
  { value: "moved", label: "Moved" },
];

export type CohortMoveBlocker =
  | "same_cohort"
  | "later_cohort"
  | "completed"
  | "already_enrolled"
  | "not_found";

export const COHORT_MOVE_BLOCKER_LABELS: Record<CohortMoveBlocker, string> = {
  same_cohort: "already in this cohort",
  later_cohort: "their cohort does not start before this one",
  completed: "has completed SOGP",
  already_enrolled: "already has an enrolment in this cohort",
  not_found: "enrolment not found",
};

export function isCohortMoveResponse(value: unknown): value is CohortMoveResponse {
  return value === "asked" || value === "declined";
}

/**
 * Why this enrolment cannot move to the target, or null when it can. Shared by
 * the list (to decide who gets the controls) and the server (to enforce it).
 * The server additionally checks for an existing enrolment in the target.
 */
export function getCohortMoveBlocker(
  enrollee: {
    cohortId: number;
    cohortStartsAt: string | Date;
    status: string;
    certificateIssued: boolean;
  },
  target: { id: number; startsAt: string | Date },
): CohortMoveBlocker | null {
  if (enrollee.cohortId === target.id) return "same_cohort";
  if (new Date(enrollee.cohortStartsAt).getTime() >= new Date(target.startsAt).getTime()) {
    return "later_cohort";
  }
  if (enrollee.status === "completed" || enrollee.certificateIssued) return "completed";
  return null;
}

export function cohortMoveLabel(state: CohortMoveState | null | undefined): string {
  if (!state) return "Not asked";
  if (state.status === "moved") return `Moved from ${state.fromCohortTitle}`;
  return state.status === "asked" ? "Asked" : "Declined";
}

/** `canMove` separates "not asked yet" from people the move never applied to. */
export function matchesCohortMoveFilter(
  state: CohortMoveState | null | undefined,
  canMove: boolean,
  filter: CohortMoveFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "not_asked") return canMove && !state;
  return state?.status === filter;
}
