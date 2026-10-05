import * as XLSX from "xlsx";

import {
  MINISTRY_FIELDS,
  activityLines,
  sumMinistryNumbers,
  totalReached,
  type DayActivity,
  type MinistryNumbers,
} from "./ministry-report";

export type MinistryWorkbookRow = {
  name: string;
  unitName: string | null;
  report: (MinistryNumbers & { note: string | null }) | null;
  activity: DayActivity;
};

/** One day's ministry reports as a spreadsheet: a row per member, then the day's totals. */
export function buildMinistryDayWorkbook(
  rows: MinistryWorkbookRow[],
  dateKey: string,
): Buffer {
  const memberSheet = XLSX.utils.json_to_sheet(
    rows.map((row) => {
      const numbers: Record<string, number | string> = {};
      for (const field of MINISTRY_FIELDS) {
        numbers[field.label] = row.report ? row.report[field.key] : "";
      }
      const activity: Record<string, string> = {};
      for (const line of activityLines(row.activity)) {
        activity[line.label] = line.detail ?? "";
      }
      return {
        Date: dateKey,
        Name: row.name,
        Group: row.unitName ?? "",
        "Report sent": row.report ? "Yes" : "No",
        ...numbers,
        Note: row.report?.note ?? "",
        ...activity,
      };
    }),
  );

  const reported = rows.flatMap((row) => (row.report ? [row.report] : []));
  const totals = sumMinistryNumbers(reported);
  const totalsSheet = XLSX.utils.json_to_sheet([
    {
      Date: dateKey,
      Members: rows.length,
      "Reports sent": reported.length,
      ...Object.fromEntries(
        MINISTRY_FIELDS.map((field) => [field.label, totals[field.key]]),
      ),
    },
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, memberSheet, "Members");
  XLSX.utils.book_append_sheet(workbook, totalsSheet, "Totals");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

function numberCells(row: MinistryNumbers): Record<string, number> {
  return Object.fromEntries(
    MINISTRY_FIELDS.map((field) => [field.label, row[field.key]]),
  );
}

export type MinistryRangeWorkbookInput = {
  fromKey: string;
  toKey: string;
  byMember: Array<
    MinistryNumbers & { name: string; unitName: string | null; reports: number }
  >;
  byDay: Array<MinistryNumbers & { dateKey: string; reports: number }>;
  contacts: Array<{
    metDate: string;
    memberName: string;
    name: string;
    phone: string | null;
    note: string | null;
    followedUpAt: string | null;
    followedUpByName: string | null;
    followUpNote: string | null;
  }>;
};

/**
 * A date range as a spreadsheet: totals per member, totals per day, and the
 * people met. The last sheet holds names and phone numbers of people outside
 * Pleros, so this export is for admins only.
 */
export function buildMinistryRangeWorkbook(input: MinistryRangeWorkbookInput): Buffer {
  const memberSheet = XLSX.utils.json_to_sheet(
    [...input.byMember]
      .sort((a, b) => totalReached(b) - totalReached(a))
      .map((row) => ({
        Name: row.name,
        Group: row.unitName ?? "",
        "Reports sent": row.reports,
        "Total reached": totalReached(row),
        ...numberCells(row),
      })),
  );
  const daySheet = XLSX.utils.json_to_sheet(
    [...input.byDay]
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .map((row) => ({
        Date: row.dateKey,
        "Reports sent": row.reports,
        "Total reached": totalReached(row),
        ...numberCells(row),
      })),
  );
  const contactSheet = XLSX.utils.json_to_sheet(
    input.contacts.map((contact) => ({
      "Date met": contact.metDate,
      "Met by": contact.memberName,
      Name: contact.name,
      Phone: contact.phone ?? "",
      Note: contact.note ?? "",
      "Followed up": contact.followedUpAt ? contact.followedUpAt.slice(0, 10) : "No",
      "Followed up by": contact.followedUpByName ?? "",
      "Follow-up note": contact.followUpNote ?? "",
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, memberSheet, "By member");
  XLSX.utils.book_append_sheet(workbook, daySheet, "By day");
  XLSX.utils.book_append_sheet(workbook, contactSheet, "People met");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
