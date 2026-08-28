import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { sendPushToUser } from "@/lib/push/send";
import { buildSogpPrayerWatchPushCandidate } from "@/lib/sogp/notifications";

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
    const enrollments = await db
      .select({ userId: schema.sogpEnrollments.userId })
      .from(schema.sogpEnrollments)
      .where(eq(schema.sogpEnrollments.cohortId, cohort.id));

    for (const enrollment of enrollments) {
      const candidate = buildSogpPrayerWatchPushCandidate({
        now,
        userId: enrollment.userId,
        cohortId: cohort.id,
        cohortStatus: cohort.status,
      });
      if (!candidate) continue;
      const checkpoint = await db.query.notificationCheckpoints.findFirst({
        where: (item, { eq: equal }) => equal(item.key, candidate.key),
      });
      if (checkpoint) continue;
      const deliveries = await sendPushToUser(enrollment.userId, {
        title: candidate.title,
        body: candidate.body,
        url: candidate.url,
      });
      if (deliveries.length === 0) continue;
      await db.insert(schema.notificationCheckpoints).values({
        key: candidate.key,
        value: String(deliveries.length),
      });
      sent.push(candidate.key);
    }
  }

  return NextResponse.json({ sent });
}
