import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { siteWebPushSubscriptions } from "@/lib/db/schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { endpoint, keys, topics } = (body ?? {}) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    topics?: { newContent?: boolean; prayerWatch?: boolean };
  };

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
  }

  const newContentEnabled = topics?.newContent ?? true;
  const prayerWatchEnabled = topics?.prayerWatch ?? true;

  await db
    .insert(siteWebPushSubscriptions)
    .values({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      newContentEnabled,
      prayerWatchEnabled,
    })
    .onConflictDoUpdate({
      target: siteWebPushSubscriptions.endpoint,
      set: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        newContentEnabled,
        prayerWatchEnabled,
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}
