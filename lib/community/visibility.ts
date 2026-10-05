/**
 * Reduces a unit member to the only shape peers (and leaders) may see:
 * first name, the month they joined, and a coarse progress stage. Never
 * surname, email, phone, or exact dates. `messageUserId` is an opaque id that
 * is present only when the viewer may privately message that member.
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
  messageUserId: string | null;
};

const monthFmt = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

/** "Oct 2026" — the only join date peers ever see. */
export function joinMonthLabel(date: Date): string {
  return monthFmt.format(date);
}

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
  /** Set by the caller once the messaging rules allow it; defaults to hidden. */
  messageUserId?: string | null;
}): PeerMember {
  const stage = deriveReferralStage({
    cohortStatus: input.cohortStatus,
    enrollmentStatus: input.enrollmentStatus,
    preparationDaysComplete: input.preparationDaysComplete,
  });
  return {
    firstName: firstNameOf(input.firstName || input.name),
    joinedMonth: joinMonthLabel(input.joinedAt),
    stage,
    stageLabel: referralStageLabel(stage),
    isLeader: input.role === "leader",
    messageUserId: input.messageUserId ?? null,
  };
}
