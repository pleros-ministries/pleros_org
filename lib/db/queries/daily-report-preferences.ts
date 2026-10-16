import "server-only";
import { dailyReportingEnabled } from "./daily-report-declarations";
import { churchOrganisationEnabled } from "./church-organisation";
/** Live by user decision: reminders run wherever daily reporting and church organisation are on. */
export function reportRemindersEnabled() {
  return dailyReportingEnabled() && churchOrganisationEnabled();
}
