import "server-only";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/db/transaction";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { inputRecord, parseMinistryReport, reportId, reportRequestKey } from "@/lib/community/reporting-v3-input";
import { requireReportingV3, reportingV3SchemaReady } from "./reporting-v3-gate";
import { requireOwnedReportContacts } from "./private-ministry-contacts";
import { lockDailyReporting, clearDeclaredNil } from "./daily-report-declarations";
import { clearNoReason } from "./report-answers";
import { writableReportDate, writeReportActivity, replaceReportContacts } from "./reporting-v3-store";
import { reconcileFollowUps } from "./ministry-activities";
import { writeMinistryDetails } from "./report-popups";

export async function saveMinistryReportV3(userId: string, value: unknown) {
  requireReportingV3();
  const input = inputRecord(value), requestKey = reportRequestKey(input.requestKey), dateKey = writableReportDate(input.dateKey);
  const parsed = parseMinistryReport(input);
  const editingId = input.activityId == null ? null : reportId(input.activityId);
  return transactionDb.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`ministry-report:${userId}:${requestKey}`}, 0))`);
    await lockDailyReporting(tx, userId, dateKey);
    const [retry] = await tx.select({ activity: s.ministryActivities, entry: s.ministryReportEntries }).from(s.ministryReportEntries).innerJoin(s.ministryActivities, eq(s.ministryActivities.id, s.ministryReportEntries.activityId)).where(and(eq(s.ministryReportEntries.userId, userId), eq(s.ministryReportEntries.requestKey, requestKey), eq(s.ministryActivities.userId, userId)));
    if (retry && editingId === null) {
      if (retry.activity.activityDate !== dateKey || Object.entries(parsed.activity).some(([key, val]) => retry.activity[key as keyof typeof parsed.activity] !== val) || retry.entry.method !== parsed.method || retry.entry.context !== parsed.context || JSON.stringify(Object.entries(retry.entry.enteredOutcomes).sort()) !== JSON.stringify(Object.entries(parsed.enteredOutcomes).sort())) throw new CommunityError("That report was saved with different details. Reload before changing it.");
      const previous = await tx.select().from(s.ministryReportContacts).where(eq(s.ministryReportContacts.activityId, retry.activity.id));
      const keys = previous.map(row => row.privateContactId !== null ? `private:${row.privateContactId}` : `legacy:${row.legacyContactId}`).sort();
      if (JSON.stringify(keys) !== JSON.stringify([...parsed.contacts].sort())) throw new CommunityError("That report was saved with different contacts. Reload before changing it.");
      return { activityId: retry.activity.id };
    }
    const contacts = await requireOwnedReportContacts(tx, userId, parsed.contacts);
    if (editingId !== null) {
      const [legacyMeeting] = await tx.select({ id: s.churchMeetingReports.activityId }).from(s.churchMeetingReports).where(eq(s.churchMeetingReports.activityId, editingId));
      if (legacyMeeting) throw new CommunityError("Use the meeting attendance form for that report.");
      const [editable] = await tx.select({ id: s.ministryReportEntries.activityId }).from(s.ministryReportEntries).where(and(eq(s.ministryReportEntries.activityId, editingId), eq(s.ministryReportEntries.userId, userId)));
      if (!editable) throw new CommunityError("Use the original form for a legacy activity, or choose your own report.");
    }
    const activityId = await writeReportActivity(tx, userId, dateKey, parsed.activity, editingId);
    await tx.insert(s.ministryReportEntries).values({ activityId, userId, requestKey, method: parsed.method, context: parsed.context, enteredOutcomes: parsed.enteredOutcomes }).onConflictDoUpdate({ target: s.ministryReportEntries.activityId, set: { method: parsed.method, context: parsed.context, enteredOutcomes: parsed.enteredOutcomes } });
    await replaceReportContacts(tx, activityId, contacts);
    await writeMinistryDetails(tx, activityId, parsed.details);
    if (parsed.activity.kind === "follow_up") {
      const method = parsed.method === "Phone call" ? "call" : parsed.method === "WhatsApp" ? "whatsapp" : parsed.method === "In person" ? "visit" : "other";
      await reconcileFollowUps(tx, { userId, activityId, dateKey, followUps: contacts.flatMap(row => row.legacyContactId === null ? [] : [{ contactId: row.legacyContactId, kind: method, outcomes: { saved: false, filled: false, healed: false }, note: null }]) });
    }
    await clearDeclaredNil(tx, userId, dateKey, "ministry");
    await clearNoReason(tx, userId, dateKey, parsed.activity.kind === "follow_up" ? "discipleship" : "evangelism");
    return { activityId };
  });
}

export async function ownReportContacts(userId: string, activityId: number) {
  if (!reportingV3SchemaReady()) return [];
  const [activity] = await db.select({ id: s.ministryActivities.id }).from(s.ministryActivities).where(and(eq(s.ministryActivities.id, activityId), eq(s.ministryActivities.userId, userId)));
  if (!activity) return [];
  const rows = await db.select().from(s.ministryReportContacts).where(eq(s.ministryReportContacts.activityId, activityId));
  const privateIds = rows.flatMap(row => row.privateContactId !== null ? [row.privateContactId] : []);
  const legacyIds = rows.flatMap(row => row.legacyContactId !== null ? [row.legacyContactId] : []);
  const privateRows = privateIds.length ? await db.select({ id: s.privateMinistryContacts.id, name: s.privateMinistryContacts.name, phone: s.privateMinistryContacts.phone, email: s.privateMinistryContacts.email, note: s.privateMinistryContacts.note }).from(s.privateMinistryContacts).where(and(eq(s.privateMinistryContacts.userId, userId), inArray(s.privateMinistryContacts.id, privateIds))) : [];
  const legacyRows = legacyIds.length ? await db.select({ id: s.outreachContacts.id, name: s.outreachContacts.name, phone: s.outreachContacts.phone, note: s.outreachContacts.note }).from(s.outreachContacts).where(and(eq(s.outreachContacts.userId, userId), inArray(s.outreachContacts.id, legacyIds))) : [];
  return [...privateRows.map(({ id, ...row }) => ({ ...row, key: `private:${id}` })), ...legacyRows.map(({ id, ...row }) => ({ ...row, key: `legacy:${id}`, email: null }))];
}
export async function getOwnMinistryReportV3(userId: string, activityId: number) {
  if (!reportingV3SchemaReady()) return null;
  reportId(activityId);
  const [row] = await db.select({ activity: s.ministryActivities, entry: s.ministryReportEntries }).from(s.ministryActivities).innerJoin(s.ministryReportEntries, eq(s.ministryReportEntries.activityId, s.ministryActivities.id)).where(and(eq(s.ministryActivities.userId, userId), eq(s.ministryReportEntries.userId, userId), eq(s.ministryActivities.id, activityId)));
  return row ? { ...row, contacts: await ownReportContacts(userId, activityId) } : null;
}
