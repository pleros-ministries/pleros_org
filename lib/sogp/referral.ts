import { randomBytes } from "node:crypto";

import { deriveSogpLearnerState } from "./status";
import type { SogpCohortStatus, SogpEnrollmentStatus } from "./types";

/** 8 lowercase hex chars — shareable, URL-safe, ~4.3B space (collision-checked on insert). */
export function generateReferralCode(): string {
  return randomBytes(4).toString("hex");
}

export function buildReferralUrl(siteUrl: string, code: string): string {
  return `${siteUrl.replace(/\/$/, "")}/sogp/enrol?ref=${encodeURIComponent(code)}`;
}

export function buildReferralShareMessage(): string {
  return [
    "I'm doing SOGP — a free four-week journey to find truth and discover God's purpose.",
    "Come and join me, you can enrol for free here:",
  ].join(" ");
}

export const REFERRAL_STAGES = [
  "enrolled",
  "preparing",
  "in_course",
  "completed",
] as const;

export type ReferralStage = (typeof REFERRAL_STAGES)[number];

const STAGE_LABEL: Record<ReferralStage, string> = {
  enrolled: "Enrolled",
  preparing: "Preparing",
  in_course: "In the course",
  completed: "Completed",
};

export function referralStageLabel(stage: ReferralStage): string {
  return STAGE_LABEL[stage];
}

export function deriveReferralStage(input: {
  cohortStatus: SogpCohortStatus;
  enrollmentStatus: SogpEnrollmentStatus;
  preparationDaysComplete: number;
}): ReferralStage {
  if (input.enrollmentStatus === "completed") return "completed";
  if (input.enrollmentStatus === "withdrawn") return "enrolled";

  // deriveSogpLearnerState only accepts preparing | active | completed cohort
  // states; fold enrolment-open / draft / archived down to "preparing".
  const cohortStatus =
    input.cohortStatus === "active" || input.cohortStatus === "completed"
      ? input.cohortStatus
      : "preparing";
  const state = deriveSogpLearnerState({ cohortStatus, enrollmentStatus: input.enrollmentStatus });

  if (state === "completed") return "completed";
  if (state === "active" || state === "carryover") return "in_course";

  // Still preparing — separate "just enrolled" from "has started".
  return input.preparationDaysComplete > 0 || input.enrollmentStatus === "preparing"
    ? "preparing"
    : "enrolled";
}
