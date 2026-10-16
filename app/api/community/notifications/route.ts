import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import {
  countUnread,
  listNotifications,
} from "@/lib/db/queries/community-notifications";

export async function GET(request: Request) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (new URL(request.url).searchParams.get("summary")) {
    return NextResponse.json({ unread: await countUnread(session.user.id) });
  }
  const [notifications, unread] = await Promise.all([
    listNotifications(session.user.id),
    countUnread(session.user.id),
  ]);
  return NextResponse.json({ notifications, unread });
}
