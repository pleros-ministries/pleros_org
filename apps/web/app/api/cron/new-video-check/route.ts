import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { notificationCheckpoints } from "@/lib/db/schema";
import { getLatestYoutubeEpisode } from "@/lib/homepage-feed";
import { notifyNewContentSubscribers } from "@/lib/push/notify-content";

const CHECKPOINT_KEY = "last_youtube_video_id";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latest = await getLatestYoutubeEpisode();
  if (!latest) {
    return NextResponse.json({ skipped: true, reason: "No videos found" });
  }

  const [checkpoint] = await db
    .select()
    .from(notificationCheckpoints)
    .where(eq(notificationCheckpoints.key, CHECKPOINT_KEY))
    .limit(1);

  if (checkpoint?.value === latest.id) {
    return NextResponse.json({ skipped: true, reason: "No new video" });
  }

  if (checkpoint) {
    await notifyNewContentSubscribers({
      title: "New video posted",
      body: latest.title,
      path: "/",
    }).catch((err) => {
      console.error("notifyNewContentSubscribers error:", err);
    });
  }

  await db
    .insert(notificationCheckpoints)
    .values({ key: CHECKPOINT_KEY, value: latest.id })
    .onConflictDoUpdate({
      target: notificationCheckpoints.key,
      set: { value: latest.id, updatedAt: new Date() },
    });

  return NextResponse.json({ notified: !!checkpoint, videoId: latest.id });
}
