import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { setSogpLeaderboardAlias } from "@/lib/db/queries/sogp-leaderboard";

export async function PATCH(request: Request) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    alias?: unknown;
  } | null;
  if (
    !body ||
    (body.alias !== null && typeof body.alias !== "string")
  ) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const result = await setSogpLeaderboardAlias(
    session.user.id,
    body.alias as string | null,
  );

  if ("error" in result) {
    if (result.error === "taken") {
      return NextResponse.json(
        { error: "This name is already taken in your cohort." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Enter a name between 2 and 24 characters using letters, numbers, spaces, - or _." },
      { status: 400 },
    );
  }

  return NextResponse.json(result);
}
