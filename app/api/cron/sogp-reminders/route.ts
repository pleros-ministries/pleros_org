import { NextResponse } from "next/server";

import { pruneCheckpoints } from "@/lib/db/queries/notification-checkpoints";
import { runDiscipleshipCron } from "@/lib/db/queries/sogp-discipleship";
import {
  CHECKPOINT_RETENTION_DAYS,
  PRUNABLE_CHECKPOINT_PREFIXES,
} from "@/lib/notifications/reminder-plan";

const DAY_MS = 24 * 60 * 60 * 1_000;

/**
 * The daily cron (05:20 WAT). It runs the discipleship alerts and digest, and
 * clears out old reminder checkpoints. Prayer Watch and every other scheduled
 * learner push are sent by `/api/cron/reminder-dispatch`.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const now = new Date();

  // The two jobs are independent: a failure in one must never block the other.
  let discipleship: { alerts: number; digests: number } | { error: string };
  try {
    discipleship = await runDiscipleshipCron(now);
  } catch (error) {
    console.error("Discipleship cron failed:", error);
    discipleship = { error: "failed" };
  }

  let prunedCheckpoints: number | { error: string };
  try {
    prunedCheckpoints = await pruneCheckpoints(
      new Date(now.getTime() - CHECKPOINT_RETENTION_DAYS * DAY_MS),
      PRUNABLE_CHECKPOINT_PREFIXES,
    );
  } catch (error) {
    console.error("Checkpoint pruning failed:", error);
    prunedCheckpoints = { error: "failed" };
  }

  return NextResponse.json({ discipleship, prunedCheckpoints });
}
