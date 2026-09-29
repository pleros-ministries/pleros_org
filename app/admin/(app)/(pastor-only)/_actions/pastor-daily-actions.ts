"use server";

import { hasAdminAccess } from "@/lib/app-role";
import { requirePastorOrAdmin } from "@/lib/auth/require-role";
import { getPastorCohortStatuses, getSogpDailyParticipation } from "@/lib/db/queries/sogp-daily";
import type { StudentStatus } from "@/lib/sogp/student-status";
import { DAILY_DATE_PATTERN, type DailyParticipationRow } from "@/lib/sogp/daily-participation";

export async function getPastorSogpDailyParticipation(
  cohortId: number,
  dateKey: string,
  pastorUserId: string,
): Promise<DailyParticipationRow[]> {
  const session = await requirePastorOrAdmin();
  if (!DAILY_DATE_PATTERN.test(dateKey)) throw new Error("Invalid date");
  if (!hasAdminAccess(session.user.role) && pastorUserId !== session.user.id) {
    throw new Error("Forbidden");
  }
  return getSogpDailyParticipation(cohortId, dateKey, pastorUserId);
}

export async function getPastorEnrolleeStatuses(
  cohortId: number,
  pastorUserId: string,
): Promise<Record<number, StudentStatus>> {
  const session = await requirePastorOrAdmin();
  if (!Number.isInteger(cohortId)) throw new Error("Invalid cohort");
  if (!hasAdminAccess(session.user.role) && pastorUserId !== session.user.id) {
    throw new Error("Forbidden");
  }
  return getPastorCohortStatuses(cohortId, pastorUserId);
}
