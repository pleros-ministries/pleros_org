import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { bindPushSubscription } from "@/lib/db/queries/notification-preferences";

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    endpoint?: unknown;
    keys?: { p256dh?: unknown; auth?: unknown };
  } | null;
  if (
    !body ||
    typeof body.endpoint !== "string" ||
    typeof body.keys?.p256dh !== "string" ||
    typeof body.keys.auth !== "string"
  ) {
    return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
  }

  // Re-binds the device to whoever is signed in and refreshes its keys, so a
  // subscription first made through the public banner starts reaching them.
  await bindPushSubscription({
    userId: session.user.id,
    endpoint: body.endpoint,
    p256dh: body.keys.p256dh,
    auth: body.keys.auth,
  });

  return NextResponse.json({ ok: true });
}
