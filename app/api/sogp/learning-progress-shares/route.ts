import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { createLearningProgressShare } from "@/lib/db/queries/sogp-learning-progress-share";

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    track?: string;
    dayNumber?: number;
    quote?: string;
  } | null;

  if (!body || (body.track !== "sogp" && body.track !== "pre_sogp")) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const result = await createLearningProgressShare(session.user.id, {
    track: body.track,
    dayNumber:
      typeof body.dayNumber === "number" ? body.dayNumber : null,
    quote: body.quote ?? "",
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    id: result.id,
    imageUrl: `/api/sogp/learning-progress-shares/${result.id}/image`,
    referralUrl: result.referralUrl,
  });
}
