import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-role";
import { getSogpDailyParticipation } from "@/lib/db/queries/sogp-daily";
import { getSogpCohortById } from "@/lib/db/queries/sogp";
import { DAILY_DATE_PATTERN } from "@/lib/sogp/daily-participation";
import { buildDailyParticipationWorkbook } from "@/lib/sogp/report-workbook";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cohortId = Number(searchParams.get("cohortId"));
  const date = searchParams.get("date") ?? "";
  if (!Number.isInteger(cohortId) || !DAILY_DATE_PATTERN.test(date)) {
    return NextResponse.json({ error: "cohortId and date (YYYY-MM-DD) are required" }, { status: 400 });
  }

  const cohort = await getSogpCohortById(cohortId);
  if (!cohort) return NextResponse.json({ error: "Cohort not found" }, { status: 404 });

  const rows = await getSogpDailyParticipation(cohortId, date);
  const buffer = buildDailyParticipationWorkbook(rows, cohort.title, date);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sogp-daily-${date}.xlsx"`,
    },
  });
}
