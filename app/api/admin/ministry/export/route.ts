import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-role";
import { isDateKey, resolveMinistryRange } from "@/lib/community/ministry-report";
import {
  buildMinistryDayWorkbook,
  buildMinistryRangeWorkbook,
} from "@/lib/community/ministry-workbook";
import {
  getMinistryDay,
  getMinistryTotalsByDay,
  getMinistryTotalsByMember,
  listActivitiesForStaff,
} from "@/lib/db/queries/ministry-activities";
import {
  listContactsForStaff,
  listInteractionsForStaff,
} from "@/lib/db/queries/outreach-contacts";
import { lagosToday } from "@/lib/sogp/daily-date";

export const runtime = "nodejs";

/** Most rows one export sheet will hold. */
const EXPORT_LIMIT = 50_000;

function spreadsheet(buffer: Buffer, filename: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Ministry activities as a spreadsheet, optionally for one location group:
 * `?date=` for one day (a row per member and per activity), or `?from=&to=`
 * for a range (totals per member and per day, every activity, the people
 * met and every interaction with them).
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const search = new URL(request.url).searchParams;
  const unit = Number(search.get("unit"));
  const unitId = Number.isInteger(unit) && unit > 0 ? unit : null;

  const date = search.get("date");
  if (date) {
    if (!isDateKey(date)) {
      return NextResponse.json(
        { error: "date must be a real date as YYYY-MM-DD" },
        { status: 400 },
      );
    }
    const rows = await getMinistryDay({ dateKey: date, unitId });
    return spreadsheet(
      buildMinistryDayWorkbook(rows, date),
      `ministry-reports-${date}.xlsx`,
    );
  }

  if (!isDateKey(search.get("from")) || !isDateKey(search.get("to"))) {
    return NextResponse.json(
      { error: "Give either date, or from and to, as YYYY-MM-DD" },
      { status: 400 },
    );
  }
  const range = resolveMinistryRange(
    { from: search.get("from"), to: search.get("to") },
    lagosToday(),
  );
  const scope = { fromKey: range.from, toKey: range.to, unitId, limit: EXPORT_LIMIT };
  const [byMember, byDay, activities, contacts, interactions] = await Promise.all([
    getMinistryTotalsByMember(range.from, range.to, { unitId }),
    getMinistryTotalsByDay(range.from, range.to, { unitId }),
    listActivitiesForStaff(scope),
    listContactsForStaff(scope),
    listInteractionsForStaff(scope),
  ]);

  return spreadsheet(
    buildMinistryRangeWorkbook({
      fromKey: range.from,
      toKey: range.to,
      byMember,
      byDay,
      activities,
      contacts,
      interactions,
    }),
    `ministry-reports-${range.from}-to-${range.to}.xlsx`,
  );
}
