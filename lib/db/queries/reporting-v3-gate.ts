import "server-only";
import { CommunityError } from "@/lib/community/errors";
import { dailyReportingEnabled } from "./daily-report-declarations";

/** Activate only after 0054 and the preceding reporting migration are verified. */
export function reportingV3SchemaReady() { return process.env.DASHBOARD_REPORTING_V3_SCHEMA === "1"; }
export function reportingV3Enabled() { return process.env.DASHBOARD_REPORTING_V3 === "1" && reportingV3SchemaReady() && dailyReportingEnabled(); }
export function requireReportingV3Reads() {
  if (!reportingV3SchemaReady()) throw new CommunityError("The new reporting data is not available yet.");
}
export function requireReportingV3() {
  if (!reportingV3Enabled()) throw new CommunityError("The new reporting flow is not enabled yet.");
}
