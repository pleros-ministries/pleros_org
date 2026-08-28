import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { setSogpMorningPrayerComplete } from "@/lib/db/queries/sogp-journey";

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = (await request.json()) as { dateKey?: unknown; complete?: unknown };
  if (typeof body.dateKey !== "string" || typeof body.complete !== "boolean") {
    return NextResponse.json({ error: "Invalid Prayer Watch request" }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await setSogpMorningPrayerComplete({
        userId: session.user.id,
        dateKey: body.dateKey,
        complete: body.complete,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Prayer Watch could not be saved" },
      { status: 403 },
    );
  }
}
