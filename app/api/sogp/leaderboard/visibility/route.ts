import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { setSogpLeaderboardVisibility } from "@/lib/db/queries/sogp-leaderboard";

export async function PATCH(request: Request) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    hidden?: unknown;
  } | null;
  if (!body || typeof body.hidden !== "boolean") {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const result = await setSogpLeaderboardVisibility(
    session.user.id,
    body.hidden,
  );
  if (!result) {
    return NextResponse.json(
      { error: "SOGP enrolment not found", enrolUrl: "/sogp/enrol" },
      { status: 403 },
    );
  }

  return NextResponse.json(result);
}
