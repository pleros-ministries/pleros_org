import "server-only";
import { and, eq, gte, lte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import { CommunityError } from "@/lib/community/errors";
import { validateDailyDeclaration, type DailyReportCategory, type DailyReportDeclaration } from "@/lib/community/daily-report";
import { lagosToday } from "@/lib/sogp/daily-date";
import type { Tx } from "./outreach-contacts";

/** Default-live (0050 installed). DASHBOARD_DAILY_REPORTS_V2=0 rolls back and skips the new tables. */
export function dailyReportingEnabled(): boolean {
  return process.env.DASHBOARD_DAILY_REPORTS_V2 !== "0";
}
function requireEnabled() {
  if (!dailyReportingEnabled()) throw new CommunityError("Daily report confirmations are not available yet.");
}
export async function lockDailyReporting(tx: Tx, userId: string, dateKey: string) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`${userId}:${dateKey}`}, 0))`);
}
export async function clearDeclaredNil(tx: Tx, userId: string, dateKey: string, category: "ministry" | "meetings") {
  await tx.delete(schema.dailyReportDeclarations).where(and(
    eq(schema.dailyReportDeclarations.userId, userId), eq(schema.dailyReportDeclarations.reportDate, dateKey),
    eq(schema.dailyReportDeclarations.category, category), eq(schema.dailyReportDeclarations.declaration, "nil"),
  ));
}

export async function getOwnDailyDeclarations(userId: string, dateKey: string) {
  if (!dailyReportingEnabled()) return [];
  return db.select({ category: schema.dailyReportDeclarations.category, declaration: schema.dailyReportDeclarations.declaration })
    .from(schema.dailyReportDeclarations)
    .where(and(eq(schema.dailyReportDeclarations.userId, userId), eq(schema.dailyReportDeclarations.reportDate, dateKey)));
}

/** userId comes only from the authenticated action, never a subject supplied by its client. */
export async function declareOwnDailyReport(userId: string, input: { dateKey: string; category: DailyReportCategory; declaration: DailyReportDeclaration }) {
  requireEnabled();
  const baseError = validateDailyDeclaration({ date: input.dateKey, today: lagosToday(), category: input.category, declaration: input.declaration, categoryActivityCount: 0 });
  if (baseError) throw new CommunityError(baseError);
  return transactionDb.transaction(async (tx) => {
    await lockDailyReporting(tx, userId, input.dateKey);
    let count = 0;
    if (input.category !== "devotional") {
      const kinds = input.category === "ministry" ? ["outreach", "follow_up"] as const : ["teaching_meeting", "prayer_meeting", "church_service", "other", "outreach_meeting"] as const;
      const [result] = await tx.select({ count: sql<number>`count(*)::int` }).from(schema.ministryActivities)
        .where(and(eq(schema.ministryActivities.userId, userId), eq(schema.ministryActivities.activityDate, input.dateKey), inArray(schema.ministryActivities.kind, [...kinds])));
      count = result.count;
    }
    const error = validateDailyDeclaration({ date: input.dateKey, today: lagosToday(), category: input.category, declaration: input.declaration, categoryActivityCount: count });
    if (error) throw new CommunityError(error);
    await tx.insert(schema.dailyReportDeclarations).values({ userId, actorUserId: userId, reportDate: input.dateKey, category: input.category, declaration: input.declaration })
      .onConflictDoUpdate({ target: [schema.dailyReportDeclarations.userId, schema.dailyReportDeclarations.reportDate, schema.dailyReportDeclarations.category], set: { declaration: input.declaration, actorUserId: userId, updatedAt: new Date() } });
  });
}


export async function getOwnMeetingDetails(userId: string, dateKey: string) {
  if (!dailyReportingEnabled()) return [];
  return db.select({ activityId: schema.dailyReportMeetingDetails.activityId, reportingRole: schema.dailyReportMeetingDetails.reportingRole, taught: schema.dailyReportMeetingDetails.taught })
    .from(schema.dailyReportMeetingDetails)
    .innerJoin(schema.ministryActivities, eq(schema.ministryActivities.id, schema.dailyReportMeetingDetails.activityId))
    .where(and(eq(schema.ministryActivities.userId, userId), eq(schema.ministryActivities.activityDate, dateKey)));
}

export async function clearOwnDailyDeclaration(userId: string, dateKey: string, category: DailyReportCategory) {
  requireEnabled();
  const error = validateDailyDeclaration({ date: dateKey, today: lagosToday(), category, declaration: category === "devotional" ? "confirmed" : "nil", categoryActivityCount: 0 });
  if (error) throw new CommunityError(error);
  await transactionDb.transaction(async (tx) => {
    await lockDailyReporting(tx, userId, dateKey);
    await tx.delete(schema.dailyReportDeclarations).where(and(eq(schema.dailyReportDeclarations.userId, userId), eq(schema.dailyReportDeclarations.reportDate, dateKey), eq(schema.dailyReportDeclarations.category, category)));
  });
}

export async function getOwnDeclarationsRange(userId: string, fromKey: string, toKey: string) {
  if (!dailyReportingEnabled()) return [];
  return db.select({ dateKey: schema.dailyReportDeclarations.reportDate, category: schema.dailyReportDeclarations.category, declaration: schema.dailyReportDeclarations.declaration }).from(schema.dailyReportDeclarations)
    .where(and(eq(schema.dailyReportDeclarations.userId, userId), gte(schema.dailyReportDeclarations.reportDate, fromKey), lte(schema.dailyReportDeclarations.reportDate, toKey)));
}
