import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import {
  countUnreadMessages,
  listConversations,
} from "@/lib/db/queries/community-messages";

/** The viewer's inbox. `?summary=1` returns only the unread total (nav badge). */
export async function GET(request: Request) {
  const summary = new URL(request.url).searchParams.get("summary");
  if (summary) {
    const session = await getAppSession();
    if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    return NextResponse.json({ unreadTotal: await countUnreadMessages(session.user.id) });
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

  const conversations = await listConversations(ctx.userId);
  return NextResponse.json({
    conversations,
    unreadTotal: conversations.reduce((sum, c) => sum + c.unreadCount, 0),
  });
}
