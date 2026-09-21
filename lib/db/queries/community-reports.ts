import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { PRE_SOGP_PREPARATION_DAYS } from "@/lib/sogp/calendar";
import { firstNameOf } from "@/lib/community/visibility";

export type LeaderReport = {
  unitId: number;
  unitName: string;
  memberCount: number;
  preparationDaysTotal: number;
  preparationBuckets: { none: number; some: number; done: number };
  morningPrayerActive: number;
  atRisk: Array<{ enrollmentId: number; firstName: string }>;
  recentJoiners: Array<{ firstName: string; joinedMonth: string }>;
};

const monthFmt = new Intl.DateTimeFormat("en-GB", {
  month: "short",
  year: "numeric",
  timeZone: "Africa/Lagos",
});

/** Read-only activity summary for one unit. Aggregates + first names only. */
export async function getLeaderReport(
  unitId: number,
): Promise<LeaderReport | null> {
  const [unit] = await db
    .select({ id: schema.units.id, name: schema.units.name })
    .from(schema.units)
    .where(eq(schema.units.id, unitId))
    .limit(1);
  if (!unit) return null;

  const members = await db
    .select({
      enrollmentId: schema.sogpEnrollments.id,
      userId: schema.sogpEnrollments.userId,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
      joinedAt: schema.unitMembers.joinedAt,
    })
    .from(schema.unitMembers)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.unitMembers.enrollmentId),
    )
    .where(eq(schema.unitMembers.unitId, unitId));

  const enrollmentIds = members.map((m) => m.enrollmentId);
  const userIds = members.map((m) => m.userId);

  const [prepRows, prayerRows] = await Promise.all([
    enrollmentIds.length
      ? db
          .select({
            enrollmentId: schema.sogpPreparationCompletions.enrollmentId,
            completed: sql<number>`count(*)::int`,
          })
          .from(schema.sogpPreparationCompletions)
          .where(
            inArray(
              schema.sogpPreparationCompletions.enrollmentId,
              enrollmentIds,
            ),
          )
          .groupBy(schema.sogpPreparationCompletions.enrollmentId)
      : Promise.resolve([]),
    userIds.length
      ? db
          .select({
            userId: schema.prayerWatchAttendance.userId,
            days: sql<number>`count(*)::int`,
          })
          .from(schema.prayerWatchAttendance)
          .where(
            and(
              inArray(schema.prayerWatchAttendance.userId, userIds),
              eq(schema.prayerWatchAttendance.session, "morning"),
            ),
          )
          .groupBy(schema.prayerWatchAttendance.userId)
      : Promise.resolve([]),
  ]);

  const prepByEnrollment = new Map(
    prepRows.map((r) => [r.enrollmentId, r.completed]),
  );
  const prayerByUser = new Map(prayerRows.map((r) => [r.userId, r.days]));

  const buckets = { none: 0, some: 0, done: 0 };
  const atRisk: LeaderReport["atRisk"] = [];
  for (const member of members) {
    const prep = prepByEnrollment.get(member.enrollmentId) ?? 0;
    if (prep === 0) buckets.none += 1;
    else if (prep >= PRE_SOGP_PREPARATION_DAYS) buckets.done += 1;
    else buckets.some += 1;

    const prayer = prayerByUser.get(member.userId) ?? 0;
    if (prep === 0 && prayer === 0) {
      atRisk.push({
        enrollmentId: member.enrollmentId,
        firstName: firstNameOf(member.firstName || member.name),
      });
    }
  }

  const recentJoiners = [...members]
    .sort((a, b) => b.joinedAt.getTime() - a.joinedAt.getTime())
    .slice(0, 5)
    .map((member) => ({
      firstName: firstNameOf(member.firstName || member.name),
      joinedMonth: monthFmt.format(member.joinedAt),
    }));

  return {
    unitId: unit.id,
    unitName: unit.name,
    memberCount: members.length,
    preparationDaysTotal: PRE_SOGP_PREPARATION_DAYS,
    preparationBuckets: buckets,
    morningPrayerActive: prayerRows.filter((r) => r.days > 0).length,
    atRisk,
    recentJoiners,
  };
}

/** Every unit's headline numbers — the admin overview. */
export async function getAllUnitReports() {
  const units = await db
    .select({ id: schema.units.id, name: schema.units.name })
    .from(schema.units)
    .where(eq(schema.units.status, "active"))
    .orderBy(desc(schema.units.name));
  const reports = [];
  for (const unit of units) {
    const report = await getLeaderReport(unit.id);
    if (report) reports.push(report);
  }
  return reports;
}
