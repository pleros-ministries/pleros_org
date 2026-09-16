import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { submitOrientationSurvey } from "@/lib/db/queries/sogp-orientation-survey";

export async function POST(request: Request) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    reasons?: string[];
    question?: string;
  } | null;
  if (!body || !Array.isArray(body.reasons)) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const result = await submitOrientationSurvey(session.user.id, {
    reasons: body.reasons,
    question: body.question,
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json(result);
}
