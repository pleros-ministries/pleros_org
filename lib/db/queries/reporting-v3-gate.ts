import "server-only";
import { CommunityError } from "@/lib/community/errors";
import { dailyReportingEnabled } from "./daily-report-declarations";

/** Default-live now that 0050/0054 are installed on the shared target. Set
 *  DASHBOARD_REPORTING_V3=0 to roll back writes/UI (history stays readable);
 *  DASHBOARD_REPORTING_V3_SCHEMA=0 only for a database without 0054. */
export function reportingV3SchemaReady() { return process.env.DASHBOARD_REPORTING_V3_SCHEMA !== "0"; }
export function reportingV3Enabled() { return process.env.DASHBOARD_REPORTING_V3 !== "0" && reportingV3SchemaReady() && dailyReportingEnabled(); }
export function requireReportingV3Reads() {
  if (!reportingV3SchemaReady()) throw new CommunityError("The new reporting data is not available yet.");
}
export function requireReportingV3() {
  if (!reportingV3Enabled()) throw new CommunityError("The new reporting flow is not enabled yet.");
}
