import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/auth/require-role";
import { getSogpReportData } from "@/lib/db/queries/sogp-report";
import { buildSogpReport } from "@/lib/sogp/report";
import { buildSogpReportWorkbook } from "@/lib/sogp/report-workbook";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cohortIdParam = searchParams.get("cohortId");
  const cohortId = cohortIdParam && cohortIdParam !== "all" ? Number(cohortIdParam) : null;

  const pastorId = searchParams.get("pastorId");

  const raw = await getSogpReportData();
  const report = buildSogpReport(raw, new Date(), { pastorId: pastorId && pastorId !== "all" ? pastorId : undefined });
  const buffer = buildSogpReportWorkbook(report, cohortId);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sogp-report-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
