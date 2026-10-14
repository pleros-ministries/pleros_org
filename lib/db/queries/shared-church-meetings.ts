import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/db/transaction";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { emptyMinistryNumbers, isDateKey } from "@/lib/community/ministry-report";
import { canUseMeetingUnit } from "@/lib/community/reporting-v3";
import { churchBranchIds } from "@/lib/church/permissions";
import { inputRecord, parseReportContacts, parseSharedMeeting, reportId, reportRequestKey } from "@/lib/community/reporting-v3-input";
import { requireReportingV3, reportingV3SchemaReady } from "./reporting-v3-gate";
import { churchOrganisationEnabled, getChurchAssignment, loadChurchAssignmentForTransaction, requireChurchReportAccess } from "./church-organisation";
import { lockDailyReporting, clearDeclaredNil } from "./daily-report-declarations";
import { requireOwnedReportContacts } from "./private-ministry-contacts";
import { ownReportContacts } from "./ministry-report-v3";
import { replaceReportContacts, writableReportDate, writeReportActivity } from "./reporting-v3-store";
import type { Tx } from "./outreach-contacts";

function requireMeetingGate() {
  requireReportingV3();
  if (!churchOrganisationEnabled()) throw new CommunityError("Shared meetings require church assignments to be enabled.");
}
async function requireUnit(tx: Tx, userId: string, unitId: number) {
  reportId(unitId);
  const actor = await loadChurchAssignmentForTransaction(tx, userId);
  const [unit] = await tx.select().from(s.churchUnits).where(eq(s.churchUnits.id, unitId));
  if (!unit || !canUseMeetingUnit(actor, unit)) throw new CommunityError("That church unit is not available to you.");
  return unit;
}
export async function listMeetingUnits(userId: string) {
  if (!reportingV3SchemaReady() || !churchOrganisationEnabled()) return [];
  const assignment = await getChurchAssignment(userId);
  if (!assignment) return [];
  const scope = assignment.role === "pastor" ? undefined : assignment.role === "branch_pastor" ? inArray(s.churchUnits.branchId, churchBranchIds(assignment)) : and(eq(s.churchUnits.id, assignment.unitId ?? -1), eq(s.churchUnits.branchId, assignment.branchId ?? -1));
  return db.select().from(s.churchUnits).where(scope).orderBy(s.churchUnits.name);
}
function attendedValue(input: Record<string, unknown>) {
  if (typeof input.attended !== "boolean") throw new CommunityError("Confirm whether you attended.");
  return input.attended;
}
async function writeAttendance(tx: Tx, userId: string, meeting: typeof s.churchSharedMeetings.$inferSelect, input: Record<string, unknown>) {
  const attended = attendedValue(input), keys = parseReportContacts(input.contacts);
  const participation = meeting.creatorUserId === userId ? "leader" : input.participation;
  if (participation !== "leader" && participation !== "worker" && participation !== "disciple" || participation === "leader" && meeting.creatorUserId !== userId) throw new CommunityError("Choose Worker or Disciple for your attendance report.");
  const contacts = await requireOwnedReportContacts(tx, userId, keys);
  const [existing] = await tx.select().from(s.churchMeetingReports).where(and(eq(s.churchMeetingReports.meetingId, meeting.id), eq(s.churchMeetingReports.userId, userId)));
  const activityId = await writeReportActivity(tx, userId, meeting.meetingDate, {
    ...emptyMinistryNumbers(), kind: meeting.kind, title: meeting.subject, mode: null, platform: null, location: meeting.venue, note: null,
    attendance: attended ? 1 : 0,
  }, existing?.activityId ?? null);
  await tx.insert(s.churchMeetingReports).values({ meetingId: meeting.id, userId, activityId, participation, attended, peopleBrought: contacts.length }).onConflictDoUpdate({ target: [s.churchMeetingReports.meetingId, s.churchMeetingReports.userId], set: { participation, attended, peopleBrought: contacts.length } });
  await replaceReportContacts(tx, activityId, contacts);
  await clearDeclaredNil(tx, userId, meeting.meetingDate, "meetings");
  return { activityId };
}
export async function createSharedChurchMeeting(userId: string, value: unknown) {
  requireMeetingGate();
  const input = inputRecord(value), requestKey = reportRequestKey(input.requestKey), dateKey = writableReportDate(input.dateKey), unitId = reportId(input.unitId);
  const parsed = parseSharedMeeting(input);
  if (parsed.startsAt && parsed.endsAt) {
    const day = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(date);
    if (day(parsed.startsAt) !== dateKey) throw new CommunityError("The start must match the selected Lagos day.");
  }
  attendedValue(input); parseReportContacts(input.contacts);
  return transactionDb.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('pleros:church-assignments', 0))`);
    await requireUnit(tx, userId, unitId);
    await lockDailyReporting(tx, userId, dateKey);
    const [retry] = await tx.select().from(s.churchSharedMeetings).where(and(eq(s.churchSharedMeetings.creatorUserId, userId), eq(s.churchSharedMeetings.requestKey, requestKey)));
    if (retry) {
      if (retry.unitId !== unitId || retry.meetingDate !== dateKey || retry.kind !== parsed.kind || retry.subject !== parsed.subject || retry.venue !== parsed.venue || retry.totalAttendance !== parsed.totalAttendance || retry.startsAt?.getTime() !== parsed.startsAt?.getTime() || retry.endsAt?.getTime() !== parsed.endsAt?.getTime()) throw new CommunityError("That meeting was saved with different details. Reload before changing it.");
      const [own] = await tx.select().from(s.churchMeetingReports).where(and(eq(s.churchMeetingReports.meetingId, retry.id), eq(s.churchMeetingReports.userId, userId)));
      if (!own) throw new CommunityError("The meeting exists; open it to record your attendance.");
      const oldContacts = await tx.select().from(s.ministryReportContacts).where(eq(s.ministryReportContacts.activityId, own.activityId));
      const oldKeys = oldContacts.map(row => row.privateContactId !== null ? `private:${row.privateContactId}` : `legacy:${row.legacyContactId}`).sort();
      if (own.attended !== input.attended || JSON.stringify(oldKeys) !== JSON.stringify(parseReportContacts(input.contacts).sort())) throw new CommunityError("Your meeting report was saved with different details. Open it to make a correction.");
      return { meetingId: retry.id, activityId: own.activityId };
    }
    const [meeting] = await tx.insert(s.churchSharedMeetings).values({ unitId, creatorUserId: userId, requestKey, meetingDate: dateKey, ...parsed }).returning();
    const own = await writeAttendance(tx, userId, meeting, input);
    return { meetingId: meeting.id, activityId: own.activityId };
  });
}
export async function saveSharedMeetingAttendance(userId: string, value: unknown) {
  requireMeetingGate();
  const input = inputRecord(value), meetingId = reportId(input.meetingId);
  if (input.participation === "leader") throw new CommunityError("Only the original leader creates the shared meeting.");
  return transactionDb.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('pleros:church-assignments', 0))`);
    const [meeting] = await tx.select().from(s.churchSharedMeetings).where(eq(s.churchSharedMeetings.id, meetingId));
    if (!meeting) throw new CommunityError("Meeting not listed yet.");
    writableReportDate(meeting.meetingDate);
    await requireUnit(tx, userId, meeting.unitId);
    await lockDailyReporting(tx, userId, meeting.meetingDate);
    return writeAttendance(tx, userId, meeting, input);
  });
}
function serialMeeting(row: typeof s.churchSharedMeetings.$inferSelect, userId: string) {
  return { id: row.id, unitId: row.unitId, kind: row.kind, meetingDate: row.meetingDate, subject: row.subject, venue: row.venue, totalAttendance: row.totalAttendance, ledByYou: row.creatorUserId === userId, startsAt: row.startsAt?.toISOString() ?? null, endsAt: row.endsAt?.toISOString() ?? null };
}
export async function listSharedChurchMeetings(userId: string, unitId: number, dateKey: string) {
  if (!reportingV3SchemaReady() || !churchOrganisationEnabled()) return [];
  if (!isDateKey(dateKey)) throw new CommunityError("Choose a valid meeting day.");
  return transactionDb.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended('pleros:church-assignments', 0))`);
    await requireUnit(tx, userId, unitId);
    const rows = await tx.select({ meeting: s.churchSharedMeetings, creatorName: s.users.name, ownReport: s.churchMeetingReports }).from(s.churchSharedMeetings).innerJoin(s.users, eq(s.users.id, s.churchSharedMeetings.creatorUserId)).leftJoin(s.churchMeetingReports, and(eq(s.churchMeetingReports.meetingId, s.churchSharedMeetings.id), eq(s.churchMeetingReports.userId, userId))).where(and(eq(s.churchSharedMeetings.unitId, unitId), eq(s.churchSharedMeetings.meetingDate, dateKey))).orderBy(s.churchSharedMeetings.id).limit(100);
    return rows.map(row => ({ ...serialMeeting(row.meeting, userId), creatorName: row.creatorName, ownReport: row.ownReport ? { activityId: row.ownReport.activityId, participation: row.ownReport.participation, attended: row.ownReport.attended, peopleBrought: row.ownReport.peopleBrought } : null }));
  });
}
export async function getOwnSharedMeetingReport(userId: string, activityId: number) {
  if (!reportingV3SchemaReady()) return null;
  const [row] = await db.select({ report: s.churchMeetingReports, meeting: s.churchSharedMeetings }).from(s.churchMeetingReports).innerJoin(s.churchSharedMeetings, eq(s.churchSharedMeetings.id, s.churchMeetingReports.meetingId)).where(and(eq(s.churchMeetingReports.userId, userId), eq(s.churchMeetingReports.activityId, reportId(activityId))));
  return row ? { report: { activityId: row.report.activityId, participation: row.report.participation, attended: row.report.attended, peopleBrought: row.report.peopleBrought }, meeting: serialMeeting(row.meeting, userId), contacts: await ownReportContacts(userId, activityId) } : null;
}

async function sharedDetailRows(userId: string, dateKey: string) {
  return db.select({ report: s.churchMeetingReports, meeting: s.churchSharedMeetings, unit: s.churchUnits }).from(s.churchMeetingReports)
    .innerJoin(s.ministryActivities, eq(s.ministryActivities.id, s.churchMeetingReports.activityId))
    .innerJoin(s.churchSharedMeetings, eq(s.churchSharedMeetings.id, s.churchMeetingReports.meetingId))
    .innerJoin(s.churchUnits, eq(s.churchUnits.id, s.churchSharedMeetings.unitId))
    .where(and(eq(s.churchMeetingReports.userId, userId), eq(s.ministryActivities.userId, userId), eq(s.ministryActivities.activityDate, dateKey))).limit(100);
}
function sharedDetail(row: Awaited<ReturnType<typeof sharedDetailRows>>[number], userId: string) {
  return { activityId: row.report.activityId, reportingRole: row.report.participation, taught: null, shared: true as const, attended: row.report.attended, peopleBrought: row.report.peopleBrought, totalAttendance: row.meeting.creatorUserId === userId ? row.meeting.totalAttendance : null };
}
export async function getOwnSharedMeetingDetails(userId: string, dateKey: string) {
  if (!reportingV3SchemaReady()) return [];
  return (await sharedDetailRows(userId, dateKey)).map(row => sharedDetail(row, userId));
}
/** Internal organ projection: no contact ids, names, notes, emails or request keys. */
export async function getScopedSharedMeetingDetails(viewerId: string, subjectId: string, dateKey: string) {
  if (!reportingV3SchemaReady()) return new Map<number, ReturnType<typeof sharedDetail> | null>();
  await requireChurchReportAccess(viewerId, subjectId);
  const viewer = await getChurchAssignment(viewerId);
  return new Map((await sharedDetailRows(subjectId, dateKey)).map(row => [row.report.activityId, canUseMeetingUnit(viewer, row.unit) ? sharedDetail(row, subjectId) : null] as const));
}
