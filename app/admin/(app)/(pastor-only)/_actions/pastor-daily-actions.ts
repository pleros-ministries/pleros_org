"use server";

import { hasAdminAccess } from "@/lib/app-role";
import { requirePastorOrAdmin } from "@/lib/auth/require-role";
import { getSogpDailyParticipation } from "@/lib/db/queries/sogp-daily";
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
