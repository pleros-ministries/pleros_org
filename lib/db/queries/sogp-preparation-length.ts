import { and, count, eq, inArray, max } from "drizzle-orm";

import { db } from "@/lib/db";
import { PRE_SOGP_PREPARATION_DAYS } from "@/lib/sogp/calendar";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";

import * as schema from "../schema";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How many days a cohort's Pre-SOGP calendar spans: from its preparation start
 * through its last published day, never shorter than the default window. Lets
 * one cohort run longer (October 2026 runs 20 days) without changing others.
 */
export async function getCohortPreparationLength(
  cohortId: number,
  preparationStartsAt: Date,
): Promise<number> {
  const [row] = await db
    .select({ lastDate: max(schema.sogpPreparationDays.publishDate) })
    .from(schema.sogpPreparationDays)
    .where(
      and(
        eq(schema.sogpPreparationDays.cohortId, cohortId),
        eq(schema.sogpPreparationDays.status, "published"),
      ),
    );
  if (!row?.lastDate) return PRE_SOGP_PREPARATION_DAYS;

  const startKey = toLagosDateKey(preparationStartsAt);
  const span =
    Math.round(
      (Date.parse(`${row.lastDate}T00:00:00Z`) - Date.parse(`${startKey}T00:00:00Z`)) / DAY_MS,
    ) + 1;
  return Math.max(PRE_SOGP_PREPARATION_DAYS, span);
}

/** Published Pre-SOGP lesson count per cohort, for "x of N" progress totals.
 * Cohorts with fewer (or no) published days fall back to the default window. */
export async function getPreparationTotalsByCohort(
  cohortIds: number[],
): Promise<Map<number, number>> {
  const unique = [...new Set(cohortIds)];
  if (!unique.length) return new Map();
  const rows = await db
    .select({ cohortId: schema.sogpPreparationDays.cohortId, total: count() })
    .from(schema.sogpPreparationDays)
    .where(
      and(
        inArray(schema.sogpPreparationDays.cohortId, unique),
        eq(schema.sogpPreparationDays.status, "published"),
      ),
    )
    .groupBy(schema.sogpPreparationDays.cohortId);
  const totals = new Map(unique.map((id) => [id, PRE_SOGP_PREPARATION_DAYS]));
  for (const row of rows) {
    totals.set(row.cohortId, Math.max(PRE_SOGP_PREPARATION_DAYS, row.total));
  }
  return totals;
}
