"use server";

import { hasAdminAccess } from "@/lib/app-role";
import { requirePastorOrAdmin } from "@/lib/auth/require-role";
import {
  getCohortStatuses,
  getPastorCohortStatuses,
  getSogpDailyParticipation,
} from "@/lib/db/queries/sogp-daily";
import type { StudentStatus } from "@/lib/sogp/student-status";
import {
  ALL_PASTORS,
  DAILY_DATE_PATTERN,
  type DailyParticipationRow,
} from "@/lib/sogp/daily-participation";

async function requireQueueAccess(pastorUserId: string) {
  const session = await requirePastorOrAdmin();
  if (!hasAdminAccess(session.user.role) && pastorUserId !== session.user.id) {
    throw new Error("Forbidden");
  }
}

export async function getPastorSogpDailyParticipation(
  cohortId: number,
  dateKey: string,
  pastorUserId: string,
): Promise<DailyParticipationRow[]> {
  await requireQueueAccess(pastorUserId);
  if (!DAILY_DATE_PATTERN.test(dateKey)) throw new Error("Invalid date");
  return getSogpDailyParticipation(
    cohortId,
    dateKey,
    pastorUserId === ALL_PASTORS ? undefined : pastorUserId,
  );
}

export async function getPastorEnrolleeStatuses(
  cohortId: number,
  pastorUserId: string,
): Promise<Record<number, StudentStatus>> {
  await requireQueueAccess(pastorUserId);
  if (!Number.isInteger(cohortId)) throw new Error("Invalid cohort");
  return pastorUserId === ALL_PASTORS
    ? getCohortStatuses(cohortId)
    : getPastorCohortStatuses(cohortId, pastorUserId);
}
