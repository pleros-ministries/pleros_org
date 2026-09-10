/**
 * Reduces a unit member to the only shape peers (and leaders) may see:
 * first name, the month they joined, and a coarse progress stage. Never
 * surname, email, phone, or exact dates.
 */

import {
  deriveReferralStage,
  referralStageLabel,
  type ReferralStage,
} from "../sogp/referral";
import type { SogpCohortStatus, SogpEnrollmentStatus } from "../sogp/types";

export type PeerMember = {
  firstName: string;
  joinedMonth: string;
  stage: ReferralStage;
  stageLabel: string;
  isLeader: boolean;
};

const monthFmt = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] || "Someone";
}

export function toPeerMember(input: {
  name: string;
  firstName: string | null;
  joinedAt: Date;
  role: "member" | "leader";
  cohortStatus: SogpCohortStatus;
  enrollmentStatus: SogpEnrollmentStatus;
  preparationDaysComplete: number;
}): PeerMember {
  const stage = deriveReferralStage({
    cohortStatus: input.cohortStatus,
    enrollmentStatus: input.enrollmentStatus,
    preparationDaysComplete: input.preparationDaysComplete,
  });
  return {
    firstName: firstNameOf(input.firstName || input.name),
    joinedMonth: monthFmt.format(input.joinedAt),
    stage,
    stageLabel: referralStageLabel(stage),
    isLeader: input.role === "leader",
  };
}
