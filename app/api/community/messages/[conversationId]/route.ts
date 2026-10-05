import { NextResponse } from "next/server";

import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import {
  getConversationPartnerId,
  listMessages,
} from "@/lib/db/queries/community-messages";

function cursor(value: string | null): number | undefined {
  const id = Number(value);
  return value != null && Number.isInteger(id) && id >= 0 ? id : undefined;
}

/** Messages for one conversation: `?after=<id>` polls, `?before=<id>` pages back. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const { conversationId } = await params;
  const id = Number(conversationId);
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
  // Only the two participants can read a conversation.
  if (!(await getConversationPartnerId(ctx.userId, id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const search = new URL(request.url).searchParams;
  const messages = await listMessages(ctx.userId, id, {
    afterId: cursor(search.get("after")),
    beforeId: cursor(search.get("before")),
  });
  return NextResponse.json({ messages });
}
