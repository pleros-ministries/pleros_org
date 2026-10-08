import { NextResponse } from "next/server";

import { runReminderDispatcher } from "@/lib/notifications/dispatcher";

// Scheduled every five minutes in vercel.json. Each run only does work for
// learners whose reminder is due, but a busy slot loads one journey per
// learner, so allow the full Pro duration.
export const maxDuration = 300;

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  // The dispatcher reports per-step counts and never throws: a step that
  // fails is named in `errors` and the others still run.
  return NextResponse.json(await runReminderDispatcher(new Date()));
}
