import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getBestQuizScore } from "@/lib/db/queries/quizzes";
import { getSogpDayData } from "@/lib/db/queries/sogp";
import { getSubmission } from "@/lib/db/queries/submissions";
import { canAccessSogpDay } from "@/lib/sogp/day-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dayNumber: string }> },
) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { dayNumber: rawDayNumber } = await params;
  const dayNumber = Number(rawDayNumber);
  if (!Number.isInteger(dayNumber)) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const data = await getSogpDayData(session.user.id, dayNumber);
  if (!data) return NextResponse.json({ error: "Day not found" }, { status: 404 });
  const generatedAt = new Date();
  if (
    !canAccessSogpDay({
      learnerState: data.dashboard.learnerState,
      now: generatedAt,
      releaseAt: data.track.releaseAt,
    }) || data.track.lesson.status !== "published"
  ) {
    return NextResponse.json({ error: "Day is locked" }, { status: 403 });
  }

  const [bestQuizScore, submission] = await Promise.all([
    getBestQuizScore(session.user.id, data.track.lesson.id),
    getSubmission(session.user.id, data.track.lesson.id),
  ]);

  return NextResponse.json({
    ...data,
    bestQuizScore,
    submission: submission
      ? {
          id: submission.id,
          status: submission.status,
          reviewerNote: submission.reviewerNote,
        }
      : null,
    generatedAt: generatedAt.toISOString(),
  });
}
