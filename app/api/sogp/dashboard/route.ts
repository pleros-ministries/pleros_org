import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";

export async function GET() {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await getSogpDashboardData(session.user.id);
  if (!data) {
    return NextResponse.json({ error: "SOGP enrolment not found" }, { status: 404 });
  }

  return NextResponse.json({ ...data, generatedAt: new Date().toISOString() });
}
