import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getSogpLeaderboard } from "@/lib/db/queries/sogp-leaderboard";

export async function GET() {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const data = await getSogpLeaderboard(session.user.id);
  if (!data) {
    return NextResponse.json(
      { error: "SOGP enrolment not found", enrolUrl: "/sogp/enrol" },
      { status: 403 },
    );
  }

  return NextResponse.json(data);
}
