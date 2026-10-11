import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactionDb } from "@/lib/db/transaction";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { isDateKey, canReportFor } from "@/lib/community/ministry-report";
import { planDailyReportReminder } from "@/lib/community/daily-report-reminders";
import { loadChurchAssignmentForTransaction } from "@/lib/db/queries/church-organisation";
import { canReadChurchReport } from "@/lib/church/permissions";
import { loadDailyReportingFacts } from "@/lib/db/queries/church-reports";
import { lockDailyReporting } from "@/lib/db/queries/daily-report-declarations";
import { reportRemindersEnabled } from "@/lib/db/queries/daily-report-preferences";
import { sendPushToUser } from "@/lib/push/send";

/** Both paths claim the same recipient/Lagos-day key with the in-app write atomically. */
export async function sendDailyReportReminder(input: { subjectId: string; source: "manual" | "automatic"; reportDate?: string; viewerId?: string; now?: Date }) {
  if (!reportRemindersEnabled()) throw new CommunityError("Report reminders are not enabled yet.");
  const now = input.now ?? new Date(); const dateKey = input.reportDate ?? new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(now);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(now);
  if (!isDateKey(dateKey) || !canReportFor(dateKey, today)) throw new CommunityError("That report date is view only.");
  const message = "Please complete your daily report.";
  const url = `/dashboard/community/report?day=${encodeURIComponent(dateKey)}`;
  const claimed = await transactionDb.transaction(async (tx) => {
    await lockDailyReporting(tx, input.subjectId, dateKey);
    const subject = await loadChurchAssignmentForTransaction(tx, input.subjectId);
    const viewer = input.viewerId ? await loadChurchAssignmentForTransaction(tx, input.viewerId) : null;
    if (!subject || input.source === "manual" && !canReadChurchReport(viewer, subject)) throw new CommunityError("That person is outside your oversight.");
    const facts = await loadDailyReportingFacts(input.subjectId, dateKey);
    const plan = planDailyReportReminder({ now, subjectId: input.subjectId, reportDate: dateKey, expected: true, authorized: input.source === "automatic" || canReadChurchReport(viewer, subject), source: input.source, statuses: facts.statuses, alreadyRemindedToday: false });
    if (!plan) return false;
    const [claim] = await tx.insert(s.notificationCheckpoints).values({ key: plan.checkpointKey, value: "sent" }).onConflictDoNothing().returning({ key: s.notificationCheckpoints.key });
    if (!claim) return false;
    await tx.insert(s.communityNotifications).values({ userId: input.subjectId, kind: "daily_report_reminder", payload: { message, day: dateKey } });
    return true;
  });
  if (!claimed) return { sent: false, pushFailed: false };
  // A committed in-app delivery keeps its claim even if push fails: never duplicate the reminder.
  const [preference] = await db.select({ enabled: s.dailyReportPreferences.pushEnabled }).from(s.dailyReportPreferences).where(eq(s.dailyReportPreferences.userId, input.subjectId));
  let pushFailed = false;
  if (preference?.enabled) {
    try { const outcome = await sendPushToUser(input.subjectId, { title: "Daily report reminder", body: message, url }, { gate: "community" }); pushFailed = outcome.failed > 0; }
    catch { pushFailed = true; }
  }
  return { sent: true, pushFailed };
}
export async function runDailyReportReminderDispatcher(now = new Date()) {
  if (!reportRemindersEnabled()) return { enabled: false, sent: 0, failures: 0 };
  if (Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", hourCycle: "h23" }).format(now)) < 20) return { enabled: true, sent: 0, failures: 0 };
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(now);
  const audience = await db.select({ userId: s.churchAssignments.userId }).from(s.churchAssignments)
    .where(sql`not exists (select 1 from ${s.notificationCheckpoints} as checkpoints where checkpoints.key = 'daily-report:' || ${s.churchAssignments}.user_id || ':' || ${day})`);
  let sent = 0; let failures = 0;
  // Small batches keep database reads bounded by the assigned roster; no public user scan.
  for (let offset = 0; offset < audience.length; offset += 8) {
    await Promise.all(audience.slice(offset, offset + 8).map(async ({ userId }) => {
      try { const result = await sendDailyReportReminder({ subjectId: userId, source: "automatic", now }); if (result.sent) sent++; if (result.pushFailed) failures++; }
      catch { failures++; }
    }));
  }
  return { enabled: true, sent, failures };
}
