import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getActiveSogpJourney } from "@/lib/db/queries/sogp-journey";

export async function GET() {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const data = await getActiveSogpJourney(session.user.id);
  if (!data) {
    return NextResponse.json(
      { error: "SOGP enrolment not found", enrolUrl: "/sogp/enrol" },
      { status: 403 },
    );
  }
  return NextResponse.json(data);
}
