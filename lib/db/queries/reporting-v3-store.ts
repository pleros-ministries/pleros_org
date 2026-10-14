import "server-only";
import { and, eq, sql } from "drizzle-orm";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { canReportFor, isDateKey } from "@/lib/community/ministry-report";
import { ACTIVITIES_PER_DAY_MAX, type ActivityInput } from "@/lib/community/ministry-activities";
import { lagosToday } from "@/lib/sogp/daily-date";
import type { Tx } from "./outreach-contacts";

export function writableReportDate(value: unknown): string {
  if (typeof value !== "string" || !isDateKey(value) || !canReportFor(value, lagosToday())) throw new CommunityError("That report date is view only.");
  return value;
}
/** Caller holds the dated reporting lock shared with activity/Nil writers. */
export async function writeReportActivity(tx: Tx, userId: string, dateKey: string, activity: ActivityInput, activityId: number | null) {
  if (activityId !== null) {
    const [existing] = await tx.select().from(s.ministryActivities).where(and(eq(s.ministryActivities.id, activityId), eq(s.ministryActivities.userId, userId))).for("update");
    if (!existing) throw new CommunityError("That report is not yours to edit.");
    if (existing.activityDate !== dateKey || existing.kind !== activity.kind) throw new CommunityError("The report day and kind cannot change.");
    await tx.update(s.ministryActivities).set({ ...activity, updatedAt: new Date() }).where(eq(s.ministryActivities.id, activityId));
    return activityId;
  }
  const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(s.ministryActivities).where(and(eq(s.ministryActivities.userId, userId), eq(s.ministryActivities.activityDate, dateKey)));
  if (n >= ACTIVITIES_PER_DAY_MAX) throw new CommunityError(`You can log up to ${ACTIVITIES_PER_DAY_MAX} activities for one day.`);
  const [row] = await tx.insert(s.ministryActivities).values({ userId, activityDate: dateKey, ...activity }).returning({ id: s.ministryActivities.id });
  return row.id;
}
export async function replaceReportContacts(tx: Tx, activityId: number, contacts: { privateContactId: number | null; legacyContactId: number | null }[]) {
  await tx.delete(s.ministryReportContacts).where(eq(s.ministryReportContacts.activityId, activityId));
  if (contacts.length) await tx.insert(s.ministryReportContacts).values(contacts.map(row => ({ ...row, activityId })));
}
