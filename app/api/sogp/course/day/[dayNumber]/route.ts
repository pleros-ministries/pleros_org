import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getBestQuizScore } from "@/lib/db/queries/quizzes";
import { getSubmission } from "@/lib/db/queries/submissions";
import { requireSogpDayAccess } from "@/lib/sogp/server-access";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dayNumber: string }> },
) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { dayNumber: rawDayNumber } = await params;
  const dayNumber = Number(rawDayNumber);
  if (!Number.isInteger(dayNumber)) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  const generatedAt = new Date();
  let data;
  try {
    data = await requireSogpDayAccess(session.user.id, dayNumber);
  } catch {
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
