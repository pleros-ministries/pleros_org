import { NextResponse } from "next/server";

import { getCommunityContext } from "@/lib/community/context";
import {
  countUnread,
  listNotifications,
} from "@/lib/db/queries/community-notifications";

export async function GET() {
  const ctx = await getCommunityContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  const [notifications, unread] = await Promise.all([
    listNotifications(ctx.userId),
    countUnread(ctx.userId),
  ]);
  return NextResponse.json({ notifications, unread });
}
