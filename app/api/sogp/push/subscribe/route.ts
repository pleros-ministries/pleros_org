import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const body = (await request.json()) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  };
  if (
    typeof body.endpoint !== "string" ||
    typeof body.keys?.p256dh !== "string" ||
    typeof body.keys.auth !== "string"
  ) {
    return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
  }
  await db
    .insert(pushSubscriptions)
    .values({
      userId: session.user.id,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    })
    .onConflictDoNothing();
  return NextResponse.json({ ok: true });
}
