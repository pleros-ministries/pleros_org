import "server-only";
import { activityLines, MINISTRY_FIELDS } from "@/lib/community/ministry-report";
import { dailyCategoryStatus, type DailyReportCategory, type DailyReportDeclaration } from "@/lib/community/daily-report";
import { listActivitiesForDay, getDayActivity } from "./ministry-activities";
import { getOwnDailyDeclarations, getOwnMeetingDetails } from "./daily-report-declarations";
import { requireReportAccess } from "./oversight-tree";
import { getScopedSharedMeetingDetails } from "./shared-church-meetings";

/** Internal canonical report loader. Caller must authenticate owner or enforce church scope. */
export async function loadDailyReportingFacts(userId: string, dateKey: string) {
  const [activities, devotion, declarations, meetingDetails] = await Promise.all([
    listActivitiesForDay(userId, dateKey), getDayActivity(userId, dateKey),
    getOwnDailyDeclarations(userId, dateKey), getOwnMeetingDetails(userId, dateKey),
  ]);
  const lines = activityLines(devotion);
  const ministry = activities.filter((row) => row.kind === "outreach" || row.kind === "follow_up");
  const meetings = activities.filter((row) => row.kind !== "outreach" && row.kind !== "follow_up");
  const statuses = Object.fromEntries((["devotional", "ministry", "meetings"] as const).map((category) => [category,
    dailyCategoryStatus({ category, declaration: (declarations.find((row) => row.category === category)?.declaration ?? null) as DailyReportDeclaration | null, activityCount: category === "ministry" ? ministry.length : category === "meetings" ? meetings.length : 0, hasDevotionalActivity: lines.some((line) => Boolean(line.detail)) }),
  ])) as Record<DailyReportCategory, ReturnType<typeof dailyCategoryStatus>>;
  return { activities, lines, declarations, meetingDetails, statuses };
}

/** Only this sanitized projection reaches organisational readers. No notes/contact records/counts. */
export async function getChurchReport(viewerId: string, subjectId: string, dateKey: string) {
  await requireReportAccess(viewerId, subjectId);
  const [report, shared] = await Promise.all([loadDailyReportingFacts(subjectId, dateKey), getScopedSharedMeetingDetails(viewerId, subjectId, dateKey)]);
  return {
    dateKey, statuses: report.statuses, devotion: report.lines,
    activities: report.activities.filter(row => !shared.has(row.id) || shared.get(row.id) !== null).map((row) => ({
      id: row.id, kind: row.kind, title: row.title, mode: row.mode, platform: row.platform, location: row.location,
      numbers: Object.fromEntries(MINISTRY_FIELDS.map(({ key }) => [key, row[key]])),
      meeting: report.meetingDetails.find((meeting) => meeting.activityId === row.id) ?? null,
      sharedMeeting: shared.get(row.id) ?? null,
    })),
  };
}

export type ReportStatuses = Record<DailyReportCategory, ReturnType<typeof dailyCategoryStatus>>;

/**
 * Each person's report status per category for one day. Internal: callers
 * decide who may see whom (church roster or group oversight) first.
 */
export async function loadReportStatusesForUsers(ids: string[], dateKey: string): Promise<Map<string, ReportStatuses>> {
  if (!ids.length) return new Map();
  const [{ db }, s, { and, eq, inArray }, { getDayActivitiesForUsers }, { dailyReportingEnabled }] = await Promise.all([
    import("@/lib/db"), import("@/lib/db/schema"), import("drizzle-orm"), import("./ministry-activities"), import("./daily-report-declarations"),
  ]);
  const [activities, declarations, facts] = await Promise.all([
    db.select({ userId: s.ministryActivities.userId, kind: s.ministryActivities.kind }).from(s.ministryActivities).where(and(inArray(s.ministryActivities.userId, ids), eq(s.ministryActivities.activityDate, dateKey))),
    dailyReportingEnabled() ? db.select({ userId: s.dailyReportDeclarations.userId, category: s.dailyReportDeclarations.category, declaration: s.dailyReportDeclarations.declaration }).from(s.dailyReportDeclarations).where(and(inArray(s.dailyReportDeclarations.userId, ids), eq(s.dailyReportDeclarations.reportDate, dateKey))) : Promise.resolve([]),
    getDayActivitiesForUsers(ids, dateKey),
  ]);
  return new Map(ids.map((userId) => [userId, Object.fromEntries((["devotional", "ministry", "meetings"] as const).map((category) => [category, dailyCategoryStatus({
    category, declaration: (declarations.find((entry) => entry.userId === userId && entry.category === category)?.declaration ?? null) as DailyReportDeclaration | null,
    activityCount: category === "devotional" ? 0 : activities.filter((entry) => entry.userId === userId && (category === "ministry" ? entry.kind === "outreach" || entry.kind === "follow_up" : entry.kind !== "outreach" && entry.kind !== "follow_up")).length,
    hasDevotionalActivity: facts.has(userId) && activityLines(facts.get(userId)!).some((line) => Boolean(line.detail)),
  })])) as ReportStatuses]));
}

export async function getChurchRosterDay(viewerId: string, dateKey: string) {
  const { getChurchRoster } = await import("./church-organisation");
  const roster = await getChurchRoster(viewerId);
  if (!roster.length) return [];
  const statuses = await loadReportStatusesForUsers(roster.map((row) => row.userId), dateKey);
  return roster.map((row) => ({ ...row, statuses: statuses.get(row.userId)! }));
}
