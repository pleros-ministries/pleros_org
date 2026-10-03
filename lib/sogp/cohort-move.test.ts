import { describe, expect, test } from "vitest";

import {
  cohortMoveLabel,
  getCohortMoveBlocker,
  isCohortMoveResponse,
  matchesCohortMoveFilter,
  type CohortMoveState,
} from "./cohort-move";
import { buildCohortInviteMessage } from "./follow-up-messages";

const october = { id: 2, startsAt: "2026-10-12T00:00:00.000Z" };
const september = {
  cohortId: 1,
  cohortStartsAt: "2026-09-14T00:00:00.000Z",
  status: "enrolled",
  certificateIssued: false,
};

const asked: CohortMoveState = {
  status: "asked",
  at: "2026-10-03T08:00:00.000Z",
  fromCohortTitle: "SOGP September 2026",
};

describe("Cohort move rules", () => {
  test("allows an earlier-cohort enrolment to move to the target", () => {
    expect(getCohortMoveBlocker(september, october)).toBeNull();
    expect(getCohortMoveBlocker({ ...september, status: "withdrawn" }, october)).toBeNull();
  });

  test("blocks enrolments already in, or starting no earlier than, the target", () => {
    expect(getCohortMoveBlocker({ ...september, cohortId: 2 }, october)).toBe("same_cohort");
    expect(
      getCohortMoveBlocker(
        { ...september, cohortId: 3, cohortStartsAt: "2026-11-09T00:00:00.000Z" },
        october,
      ),
    ).toBe("later_cohort");
    expect(
      getCohortMoveBlocker({ ...september, cohortId: 3, cohortStartsAt: october.startsAt }, october),
    ).toBe("later_cohort");
  });

  test("keeps completed and certified learners in their cohort", () => {
    expect(getCohortMoveBlocker({ ...september, status: "completed" }, october)).toBe("completed");
    expect(getCohortMoveBlocker({ ...september, certificateIssued: true }, october)).toBe(
      "completed",
    );
  });

  test("accepts Date values as well as ISO strings", () => {
    expect(
      getCohortMoveBlocker(
        { ...september, cohortStartsAt: new Date(september.cohortStartsAt) },
        { id: 2, startsAt: new Date(october.startsAt) },
      ),
    ).toBeNull();
  });

  test("only asked and declined can be recorded by hand", () => {
    expect(isCohortMoveResponse("asked")).toBe(true);
    expect(isCohortMoveResponse("declined")).toBe(true);
    expect(isCohortMoveResponse("moved")).toBe(false);
    expect(isCohortMoveResponse(null)).toBe(false);
  });

  test("labels each state in sentence case", () => {
    expect(cohortMoveLabel(null)).toBe("Not asked");
    expect(cohortMoveLabel(asked)).toBe("Asked");
    expect(cohortMoveLabel({ ...asked, status: "declined" })).toBe("Declined");
    expect(cohortMoveLabel({ ...asked, status: "moved" })).toBe("Moved from SOGP September 2026");
  });

  test("filters by response, counting only movable enrollees as not asked", () => {
    expect(matchesCohortMoveFilter(null, false, "all")).toBe(true);
    expect(matchesCohortMoveFilter(null, true, "not_asked")).toBe(true);
    expect(matchesCohortMoveFilter(null, false, "not_asked")).toBe(false);
    expect(matchesCohortMoveFilter(asked, true, "not_asked")).toBe(false);
    expect(matchesCohortMoveFilter(asked, true, "asked")).toBe(true);
    expect(matchesCohortMoveFilter(asked, true, "declined")).toBe(false);
    expect(matchesCohortMoveFilter({ ...asked, status: "moved" }, false, "moved")).toBe(true);
    expect(matchesCohortMoveFilter(null, true, "moved")).toBe(false);
  });
});

describe("Cohort invitation message", () => {
  test("fills in the name, cohort and dates", () => {
    const message = buildCohortInviteMessage(
      " Ada ",
      "SOGP October 2026",
      "12 October 2026 – 8 November 2026",
    );
    expect(message).toContain("Hi Ada,");
    expect(message).toContain("SOGP October 2026");
    expect(message).toContain("(12 October 2026 – 8 November 2026)");
    expect(message).not.toMatch(/\[(Name|Cohort|Dates)\]/);
  });

  test("falls back to a neutral greeting without a first name", () => {
    expect(buildCohortInviteMessage("", "SOGP October 2026", "soon")).toContain("Hi there,");
  });
});
