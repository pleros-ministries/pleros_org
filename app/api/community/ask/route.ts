import { NextResponse } from "next/server";

import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { countUnreadQuestionsForAsker } from "@/lib/db/queries/ask-pleros";

/** How many of the viewer's questions have a reply they have not opened. */
export async function GET() {
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
  return NextResponse.json({
    unread: await countUnreadQuestionsForAsker(ctx.userId),
  });
}
