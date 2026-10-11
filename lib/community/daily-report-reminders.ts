import { canReportFor } from "./ministry-report";
import type { DailyReportCategory, DailyReportStatus } from "./daily-report";

const lagosDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" });
const lagosHour = new Intl.DateTimeFormat("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", hourCycle: "h23" });

/** Planning only: caller must authorize the subject and claim the same dated
 * checkpoint for both manual and automatic delivery. Never sends anything. */
export function planDailyReportReminder(input: {
  now: Date; subjectId: string; reportDate?: string; expected: boolean; authorized: boolean;
  source: "automatic" | "manual";
  statuses: Record<DailyReportCategory, DailyReportStatus>;
  alreadyRemindedToday: boolean;
}) {
  if (!input.expected || !input.authorized || input.alreadyRemindedToday) return null;
  if (Object.values(input.statuses).every((status) => status !== "missing")) return null;
  if (input.source === "automatic" && Number(lagosHour.format(input.now)) < 20) return null;
  const day = lagosDay.format(input.now);
  const reportDate = input.reportDate ?? day;
  if (!canReportFor(reportDate, day) || (input.source === "automatic" && reportDate !== day)) return null;
  return { forDate: reportDate, checkpointKey: `daily-report:${input.subjectId}:${day}`, channels: ["in_app", "opted_in_push"] as const };
}
