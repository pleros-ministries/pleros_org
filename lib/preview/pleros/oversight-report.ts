import { MINISTRY_FIELDS, type MinistryNumbers } from "@/lib/community/ministry-report";
import { dayReport } from "./daily-report";
import { findPerson, oversees } from "./scope";
import type { DemoActivity, DemoState } from "./types";

export function canSeeReportDetails(state: DemoState, viewerId: string): boolean {
  const viewer = findPerson(state, viewerId);
  return viewer?.tier === "pastor" || viewer?.tier === "pastorate";
}

function safeActivity(activity: DemoActivity) {
  const numbers = Object.fromEntries(MINISTRY_FIELDS.map(({ key }) => [key, activity[key]])) as MinistryNumbers;
  return { id: activity.id, kind: activity.kind, title: activity.title, mode: activity.mode,
    platform: activity.platform, location: activity.location, meetingRole: activity.meetingRole,
    taught: activity.taught, numbers };
}

/** Approved organisational report projection: no notes, contacts or interactions. */
export function oversightReport(state: DemoState, viewerId: string, subjectId: string, day: string) {
  if (!canSeeReportDetails(state, viewerId) || !oversees(state, viewerId, subjectId)) return null;
  const report = dayReport(state, subjectId, day);
  return { dateKey: day, statuses: report.statuses, overall: report.overall,
    devotionLines: report.devotionLines, ministry: report.ministry.map(safeActivity),
    meetings: report.meetings.map(safeActivity) };
}
export type OversightReport = NonNullable<ReturnType<typeof oversightReport>>;
