import type { ActivityKind } from "@/lib/community/ministry-activities";
import {
  NO_DAY_ACTIVITY,
  activityLines,
  canReportFor,
  emptyMinistryNumbers,
  sumMinistryNumbers,
  type ActivityLine,
  type DayActivity,
  type MinistryNumbers,
} from "@/lib/community/ministry-report";
import { shiftDate } from "@/lib/sogp/daily-date";

import type {
  CategoryDeclaration,
  CategoryStatus,
  DemoActivity,
  DemoState,
  MeetingRole,
  OverallStatus,
  ReportCategory,
} from "./types";

/**
 * The daily report as the demo models it: exactly three categories, each
 * either reported with activity, explicitly reported as nil, or missing.
 * Completeness is reporting status only, never a measure of ministry.
 */

export const REPORT_CATEGORIES: ReadonlyArray<{
  key: ReportCategory;
  label: string;
  short: string;
  hint: string;
}> = [
  {
    key: "devotional",
    label: "Devotional reports",
    short: "Devotional",
    hint: "Prayer Watch, Bible reading, podcast and SOGP, gathered from where you did them",
  },
  {
    key: "ministry",
    label: "Ministry reports",
    short: "Ministry",
    hint: "Evangelism and discipleship",
  },
  {
    key: "meetings",
    label: "Meetings reports",
    short: "Meetings",
    hint: "Teaching and prayer meetings, and your part in them",
  },
];

export function isReportCategory(value: unknown): value is ReportCategory {
  return REPORT_CATEGORIES.some((category) => category.key === value);
}

export function categoryLabel(category: ReportCategory): string {
  return REPORT_CATEGORIES.find((item) => item.key === category)!.label;
}

/** Ministry offers exactly these two stored kinds: evangelism and discipleship. */
export const MINISTRY_KINDS: readonly ActivityKind[] = ["outreach", "follow_up"];
/** Meetings offer the two existing meeting kinds. */
export const MEETING_KINDS: readonly ActivityKind[] = ["teaching_meeting", "prayer_meeting"];

/** Which category an activity belongs to. Retired kinds stay readable. */
export function categoryOfKind(kind: ActivityKind): Exclude<ReportCategory, "devotional"> {
  return kind === "teaching_meeting" || kind === "prayer_meeting" || kind === "church_service"
    ? "meetings"
    : "ministry";
}

export const MEETING_ROLES: ReadonlyArray<{
  key: MeetingRole;
  label: string;
  hint: string;
  attendanceLabel: string;
}> = [
  {
    key: "leader",
    label: "Leader",
    hint: "You led it: report the whole meeting and what was taught.",
    attendanceLabel: "People present at the whole meeting",
  },
  {
    key: "worker",
    label: "Worker",
    hint: "You served in it: report the people who came with you.",
    attendanceLabel: "People who came with you",
  },
  {
    key: "member",
    label: "Member",
    hint: "You attended: report how many were there if you know.",
    attendanceLabel: "People present",
  },
];

export function meetingRoleLabel(role: MeetingRole): string {
  return MEETING_ROLES.find((item) => item.key === role)!.label;
}

/** Lagos date keys for a tracker, oldest first, ending on `endKey`. */
export function trackerDays(endKey: string, count = 7): string[] {
  return Array.from({ length: count }, (_, index) => shiftDate(endKey, index - (count - 1)));
}

/** Writes follow the live rule: today and the previous seven Lagos days. */
export function isWritableDay(dateKey: string, todayKey: string): boolean {
  return canReportFor(dateKey, todayKey);
}

export function devotionFor(state: DemoState, personId: string, dateKey: string): DayActivity {
  return state.devotion[personId]?.[dateKey] ?? NO_DAY_ACTIVITY;
}

export function declarationFor(
  state: DemoState,
  personId: string,
  dateKey: string,
  category: ReportCategory,
): CategoryDeclaration | null {
  return state.declarations[personId]?.[dateKey]?.[category] ?? null;
}

export function activitiesFor(
  state: DemoState,
  personId: string,
  dateKey: string,
  category?: Exclude<ReportCategory, "devotional">,
): DemoActivity[] {
  return state.activities.filter(
    (activity) =>
      activity.personId === personId &&
      activity.activityDate === dateKey &&
      (!category || categoryOfKind(activity.kind) === category),
  );
}

/**
 * One category's status. Activity rows report a category; an explicit nil
 * reports it with nothing to show; anything else is missing. Devotion is
 * compiled from its sources and counts only once the person confirms it, so
 * prefilled sources alone never mark it reported.
 */
export function categoryStatus(
  state: DemoState,
  personId: string,
  dateKey: string,
  category: ReportCategory,
): CategoryStatus {
  const declaration = declarationFor(state, personId, dateKey, category);
  if (category === "devotional") {
    if (declaration !== "confirmed") return "missing";
    return recordedLines(devotionFor(state, personId, dateKey)).length > 0 ? "activity" : "nil";
  }
  if (activitiesFor(state, personId, dateKey, category).length > 0) return "activity";
  return declaration === "nil" ? "nil" : "missing";
}

export function overallStatus(statuses: CategoryStatus[]): OverallStatus {
  const reported = statuses.filter((status) => status !== "missing").length;
  if (reported === statuses.length) return "complete";
  return reported === 0 ? "not_started" : "in_progress";
}

export function recordedLines(activity: DayActivity): ActivityLine[] {
  return activityLines(activity).filter((line) => line.detail !== null);
}

export type DayReport = {
  dateKey: string;
  statuses: Record<ReportCategory, CategoryStatus>;
  overall: OverallStatus;
  reportedCount: number;
  devotion: DayActivity;
  devotionLines: ActivityLine[];
  ministry: DemoActivity[];
  meetings: DemoActivity[];
  numbers: MinistryNumbers;
};

export function dayReport(state: DemoState, personId: string, dateKey: string): DayReport {
  const statuses = {
    devotional: categoryStatus(state, personId, dateKey, "devotional"),
    ministry: categoryStatus(state, personId, dateKey, "ministry"),
    meetings: categoryStatus(state, personId, dateKey, "meetings"),
  };
  const values = Object.values(statuses);
  const ministry = activitiesFor(state, personId, dateKey, "ministry");
  const meetings = activitiesFor(state, personId, dateKey, "meetings");
  const devotion = devotionFor(state, personId, dateKey);
  return {
    dateKey,
    statuses,
    overall: overallStatus(values),
    reportedCount: values.filter((status) => status !== "missing").length,
    devotion,
    devotionLines: activityLines(devotion),
    ministry,
    meetings,
    numbers: sumMinistryNumbers([...ministry, ...meetings]),
  };
}

export const STATUS_LABELS: Record<CategoryStatus, string> = {
  activity: "Reported",
  nil: "Nil",
  missing: "Not yet",
};

export const OVERALL_LABELS: Record<OverallStatus, string> = {
  complete: "Complete",
  in_progress: "In progress",
  not_started: "Not started",
};

export { emptyMinistryNumbers };
