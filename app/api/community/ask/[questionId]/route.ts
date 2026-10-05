import { NextResponse } from "next/server";

import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { getQuestionForAsker } from "@/lib/db/queries/ask-pleros";

/** One Ask Pleros conversation, for the person who asked it only. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const { questionId } = await params;
  const id = Number(questionId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ctx = await getCommunityContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (!canAccessCommunity(ctx)) {
    return NextResponse.json(
      { error: "SOGP enrolment not found", enrolUrl: "/sogp/enrol" },
      { status: 403 },
    );
  }

  const question = await getQuestionForAsker(ctx.userId, id);
  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ question });
}
