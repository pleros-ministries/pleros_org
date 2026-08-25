import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { buildSogpChannelReminderCandidates } from "@/lib/sogp/notifications";
import { sendSogpChannelMessage } from "@/lib/telegram/sogp-broadcast";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const now = new Date();
  const cohorts = await db
    .select()
    .from(schema.sogpCohorts)
    .where(inArray(schema.sogpCohorts.status, ["preparing", "active"]));
  const sent: string[] = [];

  for (const cohort of cohorts) {
    const [tracks, liveClasses] = await Promise.all([
      db
        .select({
          id: schema.sogpCohortTracks.id,
          dayNumber: schema.sogpCohortTracks.dayNumber,
          releaseAt: schema.sogpCohortTracks.releaseAt,
          title: schema.lessons.title,
        })
        .from(schema.sogpCohortTracks)
        .innerJoin(
          schema.lessons,
          eq(schema.sogpCohortTracks.lessonId, schema.lessons.id),
        )
        .where(eq(schema.sogpCohortTracks.cohortId, cohort.id)),
      db
        .select()
        .from(schema.sogpLiveClasses)
        .where(
          and(
            eq(schema.sogpLiveClasses.cohortId, cohort.id),
            inArray(schema.sogpLiveClasses.status, ["scheduled", "live"]),
          ),
        ),
    ]);
    const candidates = buildSogpChannelReminderCandidates({
      now,
      cohort,
      tracks,
      liveClasses: liveClasses.map((item) => ({
        id: item.id,
        title: item.title,
        startsAt: item.startsAt,
        youtubeLiveUrl: item.youtubeLiveUrl,
      })),
    });
    for (const candidate of candidates) {
      const checkpoint = await db.query.notificationCheckpoints.findFirst({
        where: (item, { eq: equal }) => equal(item.key, candidate.key),
      });
      if (checkpoint) continue;
      const result = await sendSogpChannelMessage({
        kind: candidate.kind,
        message: candidate.message,
      });
      await db.insert(schema.notificationCheckpoints).values({
        key: candidate.key,
        value: String(result.messageId),
      });
      sent.push(candidate.key);
    }
  }

  return NextResponse.json({ sent });
}
