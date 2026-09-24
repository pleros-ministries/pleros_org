import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { getLearningProgressShareRenderContext } from "@/lib/db/queries/sogp-learning-progress-share";
import {
  getLearningProgressDayText,
  getLearningProgressHeadline,
  getLearningProgressTeachingLabel,
} from "@/lib/sogp/learning-progress-share";

// Read-only counterpart to POST /api/sogp/learning-progress-shares: the video
// recorder needs the learner's name and the day's lesson title/headline
// *before* it starts recording (to burn them into the video), which is
// earlier than the point at which a share row normally gets created.
export async function GET(request: Request) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const url = new URL(request.url);
  const track = url.searchParams.get("track");
  if (track !== "sogp" && track !== "pre_sogp") {
    return NextResponse.json({ error: "Invalid track" }, { status: 400 });
  }
  const dayNumberParam = url.searchParams.get("dayNumber");
  const dayNumber =
    dayNumberParam != null && Number.isInteger(Number(dayNumberParam))
      ? Number(dayNumberParam)
      : null;

  const context = await getLearningProgressShareRenderContext(
    session.user.id,
    { track, dayNumber },
  );
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: 400 });
  }

  return NextResponse.json({
    authorName: context.authorName,
    dayText: getLearningProgressDayText(context),
    teachingLabel: getLearningProgressTeachingLabel(context),
    headline: getLearningProgressHeadline(context),
  });
}
