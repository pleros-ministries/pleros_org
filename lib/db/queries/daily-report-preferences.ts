import "server-only";
import { dailyReportingEnabled } from "./daily-report-declarations";
import { churchOrganisationEnabled } from "./church-organisation";
/** Enable only after all 0050–0052 migrations and consent UI have been verified. */
export function reportRemindersEnabled() {
  return dailyReportingEnabled() && churchOrganisationEnabled() && process.env.DASHBOARD_REPORT_REMINDERS_V2 === "1";
}
