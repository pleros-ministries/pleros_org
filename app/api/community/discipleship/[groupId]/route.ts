import { NextResponse } from "next/server";

import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { canViewDiscipleshipGroup } from "@/lib/community/discipleship-access";
import { parseFeedView } from "@/lib/community/feed-view";
import { getDiscipleshipAccess } from "@/lib/db/queries/community-discipleship";
import {
  COMMUNITY_FEED_PAGE_SIZE,
  getDiscipleshipPosts,
} from "@/lib/db/queries/community-posts";

/** One page of a discipleship group's discussions, for its members only. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await params;
  const id = Number(groupId);
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
  // Only the discipler and current disciples; a 404 hides that the group exists.
  const access = await getDiscipleshipAccess(ctx.userId);
  if (!canViewDiscipleshipGroup(access, id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const search = new URL(request.url).searchParams;
  const offset = Math.max(0, Number(search.get("offset") ?? 0) || 0);
  const view = parseFeedView({
    sort: search.get("sort"),
    filter: search.get("filter"),
  });

  const posts = await getDiscipleshipPosts(id, ctx, { offset, view });
  const nextOffset =
    posts.length === COMMUNITY_FEED_PAGE_SIZE ? offset + posts.length : null;

  return NextResponse.json({ posts, nextOffset });
}
