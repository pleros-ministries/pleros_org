import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { prayerWatchRemindersSent } from "@/lib/db/schema";
import { PRAYER_WATCH_SESSIONS, PRAYER_WATCH_TIME_ZONE } from "@/lib/prayer-watch";
import { notifyPrayerWatchSubscribers } from "@/lib/push/notify-content";

const REMINDER_LEAD_MINUTES = 5;
const TOLERANCE_MINUTES = 3;

function getZonedMinutesSinceMidnight(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    timeZone,
  }).formatToParts(date);

  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");

  return hour * 60 + minute;
}

function getZonedDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = new Date();
  const currentMinutes = getZonedMinutesSinceMidnight(now, PRAYER_WATCH_TIME_ZONE);
  const todayKey = getZonedDateKey(now, PRAYER_WATCH_TIME_ZONE);

  const notified: string[] = [];

  for (const session of PRAYER_WATCH_SESSIONS) {
    const sessionMinutes = session.hour * 60 + session.minute;
    const minutesUntilSession = sessionMinutes - currentMinutes;

    const inWindow =
      Math.abs(minutesUntilSession - REMINDER_LEAD_MINUTES) <= TOLERANCE_MINUTES;

    if (!inWindow) continue;

    const [alreadySent] = await db
      .select()
      .from(prayerWatchRemindersSent)
      .where(
        and(
          eq(prayerWatchRemindersSent.sessionId, session.id),
          eq(prayerWatchRemindersSent.date, todayKey),
        ),
      )
      .limit(1);

    if (alreadySent) continue;

    await notifyPrayerWatchSubscribers({
      title: "Prayer Watch starting soon",
      body: `The ${session.label} Prayer Watch begins at ${session.time}.`,
      path: "/dashboard/prayer-watch",
    }).catch((err) => {
      console.error("notifyPrayerWatchSubscribers error:", err);
    });

    await db
      .insert(prayerWatchRemindersSent)
      .values({ sessionId: session.id, date: todayKey })
      .onConflictDoNothing();

    notified.push(session.id);
  }

  return NextResponse.json({ notified });
}
