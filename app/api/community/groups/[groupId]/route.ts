import { NextResponse } from "next/server";

import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { parseFeedView } from "@/lib/community/feed-view";
import { canViewGroupContent } from "@/lib/community/groups";
import { getGroupAccess } from "@/lib/db/queries/community-groups";
import {
  COMMUNITY_FEED_PAGE_SIZE,
  getGroupPosts,
} from "@/lib/db/queries/community-posts";

/** One page of a member-created group's discussions, for those allowed to read it. */
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
  const access = await getGroupAccess(ctx.userId, id);
  if (!access) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canViewGroupContent(access, ctx.isAdmin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const search = new URL(request.url).searchParams;
  const offset = Math.max(0, Number(search.get("offset") ?? 0) || 0);
  const view = parseFeedView({
    sort: search.get("sort"),
    filter: search.get("filter"),
  });

  const posts = await getGroupPosts(id, ctx, { offset, view });
  const nextOffset =
    posts.length === COMMUNITY_FEED_PAGE_SIZE ? offset + posts.length : null;

  return NextResponse.json({ posts, nextOffset });
}
