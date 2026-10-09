import * as XLSX from "xlsx";

import {
  ALL_ACTIVITY_KINDS,
  activityKindLabel,
  outreachModeLabel,
  platformLabel,
  type ActivityKind,
  type OutreachMode,
} from "./ministry-activities";
import {
  MINISTRY_FIELDS,
  activityLines,
  sumMinistryNumbers,
  totalReached,
  type DayActivity,
  type MinistryNumbers,
} from "./ministry-report";
import {
  DISCIPLESHIP_STATUS_LABELS,
  INTERACTION_KIND_LABELS,
  SALVATION_STATUS_LABELS,
  type ContactOutcomes,
  type DiscipleshipStatus,
  type InteractionKind,
  type SalvationStatus,
} from "./outreach-contacts";

export type WorkbookActivity = MinistryNumbers & {
  activityDate: string;
  kind: ActivityKind;
  title: string | null;
  mode: OutreachMode | null;
  platform: string | null;
  location: string | null;
  note: string | null;
  peopleCount: number;
};

export type MinistryWorkbookRow = {
  name: string;
  unitName: string | null;
  activities: WorkbookActivity[];
  totals: MinistryNumbers | null;
  activity: DayActivity;
};

function numberCells(row: MinistryNumbers | null): Record<string, number | string> {
  return Object.fromEntries(
    MINISTRY_FIELDS.map((field) => [field.label, row ? row[field.key] : ""]),
  );
}

/** A column per offered kind, plus a kind no longer offered only when it has activities. */
function kindCells(byKind: Record<ActivityKind, number>): Record<string, number> {
  return Object.fromEntries(
    ALL_ACTIVITY_KINDS.filter((kind) => kind.offered || byKind[kind.key] > 0).map((kind) => [
      kind.label,
      byKind[kind.key],
    ]),
  );
}

function countKinds(activities: Array<{ kind: ActivityKind }>): Record<ActivityKind, number> {
  const counts = {} as Record<ActivityKind, number>;
  for (const kind of ALL_ACTIVITY_KINDS) {
    counts[kind.key] = activities.filter((activity) => activity.kind === kind.key).length;
  }
  return counts;
}

/** One activity as a row: what it was, where, its numbers and note. */
function activityCells(activity: WorkbookActivity): Record<string, number | string> {
  return {
    Activity: activityKindLabel(activity.kind),
    Title: activity.title ?? "",
    Mode: activity.mode ? outreachModeLabel(activity.mode) : "",
    Platform: platformLabel(activity.platform) ?? "",
    Location: activity.location ?? "",
    ...numberCells(activity),
    People: activity.peopleCount,
    Note: activity.note ?? "",
  };
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

/**
 * One day's ministry as a spreadsheet: a row per member, a row per
 * activity, then the day's totals.
 */
export function buildMinistryDayWorkbook(
  rows: MinistryWorkbookRow[],
  dateKey: string,
): Buffer {
  const memberSheet = XLSX.utils.json_to_sheet(
    rows.map((row) => {
      const pleros: Record<string, string> = {};
      for (const line of activityLines(row.activity)) {
        pleros[line.label] = line.detail ?? "";
      }
      return {
        Date: dateKey,
        Name: row.name,
        Group: row.unitName ?? "",
        Activities: row.activities.length,
        ...numberCells(row.totals),
        Notes: row.activities
          .map((activity) => activity.note)
          .filter((note): note is string => Boolean(note))
          .join("; "),
        ...pleros,
      };
    }),
  );

  const activitySheet = XLSX.utils.json_to_sheet(
    rows.flatMap((row) =>
      row.activities.map((activity) => ({
        Date: dateKey,
        Name: row.name,
        Group: row.unitName ?? "",
        ...activityCells(activity),
      })),
    ),
  );

  const reported = rows.filter((row) => row.totals !== null);
  const activities = rows.flatMap((row) => row.activities);
  const totalsSheet = XLSX.utils.json_to_sheet([
    {
      Date: dateKey,
      Members: rows.length,
      "Members reporting": reported.length,
      Activities: activities.length,
      ...numberCells(sumMinistryNumbers(activities)),
      ...kindCells(countKinds(activities)),
    },
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, memberSheet, "Members");
  XLSX.utils.book_append_sheet(workbook, activitySheet, "Activities");
  XLSX.utils.book_append_sheet(workbook, totalsSheet, "Totals");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export type MinistryRangeWorkbookInput = {
  fromKey: string;
  toKey: string;
  byMember: Array<
    MinistryNumbers & {
      name: string;
      unitName: string | null;
      days: number;
      activities: number;
      byKind: Record<ActivityKind, number>;
    }
  >;
  byDay: Array<
    MinistryNumbers & {
      dateKey: string;
      members: number;
      activities: number;
      byKind: Record<ActivityKind, number>;
    }
  >;
  activities: Array<WorkbookActivity & { memberName: string; unitName: string | null }>;
  contacts: Array<{
    metDate: string;
    memberName: string;
    name: string;
    phone: string | null;
    note: string | null;
    salvationStatus: SalvationStatus;
    discipleshipStatus: DiscipleshipStatus;
    followUpPlan: string | null;
    nextFollowUpDate: string | null;
    interactionCount: number;
    lastInteractionDate: string | null;
    lastInteractionKind: InteractionKind | null;
    followedUpAt: string | null;
    followedUpByName: string | null;
  }>;
  interactions: Array<{
    interactionDate: string;
    kind: InteractionKind;
    outcomes: ContactOutcomes;
    note: string | null;
    contactName: string;
    contactPhone: string | null;
    memberName: string;
    loggedByName: string | null;
  }>;
};

/**
 * A date range as a spreadsheet: totals per member and per day, every
 * activity, the people met and every interaction with them. The last two
 * sheets hold names and phone numbers of people outside Pleros, so this
 * export is for admins only.
 */
export function buildMinistryRangeWorkbook(input: MinistryRangeWorkbookInput): Buffer {
  const memberSheet = XLSX.utils.json_to_sheet(
    [...input.byMember]
      .sort((a, b) => totalReached(b) - totalReached(a))
      .map((row) => ({
        Name: row.name,
        Group: row.unitName ?? "",
        Days: row.days,
        Activities: row.activities,
        "Total reached": totalReached(row),
        ...numberCells(row),
        ...kindCells(row.byKind),
      })),
  );
  const daySheet = XLSX.utils.json_to_sheet(
    [...input.byDay]
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .map((row) => ({
        Date: row.dateKey,
        Members: row.members,
        Activities: row.activities,
        "Total reached": totalReached(row),
        ...numberCells(row),
        ...kindCells(row.byKind),
      })),
  );
  const activitySheet = XLSX.utils.json_to_sheet(
    input.activities.map((activity) => ({
      Date: activity.activityDate,
      Name: activity.memberName,
      Group: activity.unitName ?? "",
      ...activityCells(activity),
    })),
  );
  const contactSheet = XLSX.utils.json_to_sheet(
    input.contacts.map((contact) => ({
      "Date met": contact.metDate,
      "Met by": contact.memberName,
      Name: contact.name,
      Phone: contact.phone ?? "",
      Note: contact.note ?? "",
      Salvation: SALVATION_STATUS_LABELS[contact.salvationStatus],
      Discipleship: DISCIPLESHIP_STATUS_LABELS[contact.discipleshipStatus],
      "Follow-up plan": contact.followUpPlan ?? "",
      "Next follow-up": contact.nextFollowUpDate ?? "",
      Interactions: contact.interactionCount,
      "Last interaction": contact.lastInteractionDate
        ? `${contact.lastInteractionDate}${
            contact.lastInteractionKind
              ? ` (${INTERACTION_KIND_LABELS[contact.lastInteractionKind]})`
              : ""
          }`
        : "",
      "Followed up": contact.followedUpAt ? contact.followedUpAt.slice(0, 10) : "No",
      "Followed up by": contact.followedUpByName ?? "",
    })),
  );
  const interactionSheet = XLSX.utils.json_to_sheet(
    input.interactions.map((item) => ({
      Date: item.interactionDate,
      Person: item.contactName,
      Phone: item.contactPhone ?? "",
      "Met by": item.memberName,
      "Logged by": item.loggedByName ?? "",
      Kind: INTERACTION_KIND_LABELS[item.kind],
      Saved: yesNo(item.outcomes.saved),
      Filled: yesNo(item.outcomes.filled),
      Healed: yesNo(item.outcomes.healed),
      Note: item.note ?? "",
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, memberSheet, "By member");
  XLSX.utils.book_append_sheet(workbook, daySheet, "By day");
  XLSX.utils.book_append_sheet(workbook, activitySheet, "Activities");
  XLSX.utils.book_append_sheet(workbook, contactSheet, "People met");
  XLSX.utils.book_append_sheet(workbook, interactionSheet, "Interactions");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
