import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { dailyCategoryStatus, type DailyReportDeclaration } from "@/lib/community/daily-report";
import { activityLines } from "@/lib/community/ministry-report";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";

import { dailyReportingEnabled } from "./daily-report-declarations";
import { getDayActivitiesForUsers } from "./ministry-activities";

export type ReportDayState = "complete" | "partial" | "missing";

/**
 * The signed-in member's own report state for a run of days, for the week
 * strip: complete (all three categories reported or Nil), partial, missing.
 */
export async function getOwnReportWeek(userId: string, dateKeys: string[]): Promise<Record<string, ReportDayState>> {
  if (!dateKeys.length) return {};
  const [activities, declarations, devotional] = await Promise.all([
    db.select({ date: s.ministryActivities.activityDate, kind: s.ministryActivities.kind })
      .from(s.ministryActivities)
      .where(and(eq(s.ministryActivities.userId, userId), inArray(s.ministryActivities.activityDate, dateKeys))),
    dailyReportingEnabled() ? db.select({ date: s.dailyReportDeclarations.reportDate, category: s.dailyReportDeclarations.category, declaration: s.dailyReportDeclarations.declaration })
      .from(s.dailyReportDeclarations)
      .where(and(eq(s.dailyReportDeclarations.userId, userId), inArray(s.dailyReportDeclarations.reportDate, dateKeys))) : [],
    Promise.all(dateKeys.map(dateKey => getDayActivitiesForUsers([userId], dateKey).then(map => [dateKey, map.get(userId)] as const).catch(() => [dateKey, undefined] as const))),
  ]);
  const facts = new Map(devotional);
  return Object.fromEntries(dateKeys.map(dateKey => {
    const day = activities.filter(row => row.date === dateKey);
    const declared = (category: string) => (declarations.find(row => row.date === dateKey && row.category === category)?.declaration ?? null) as DailyReportDeclaration | null;
    const fact = facts.get(dateKey);
    const statuses = [
      dailyCategoryStatus({ category: "devotional", declaration: declared("devotional"), activityCount: 0, hasDevotionalActivity: fact ? activityLines(fact).some(line => Boolean(line.detail)) : false }),
      dailyCategoryStatus({ category: "ministry", declaration: declared("ministry"), activityCount: day.filter(row => row.kind === "outreach" || row.kind === "follow_up").length, hasDevotionalActivity: false }),
      dailyCategoryStatus({ category: "meetings", declaration: declared("meetings"), activityCount: day.filter(row => row.kind !== "outreach" && row.kind !== "follow_up").length, hasDevotionalActivity: false }),
    ];
    const done = statuses.filter(status => status !== "missing").length;
    return [dateKey, done === 3 ? "complete" : done ? "partial" : "missing"];
  }));
}
