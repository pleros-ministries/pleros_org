import { NextResponse } from "next/server";

import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { parseFeedView } from "@/lib/community/feed-view";
import { canSeeUnit } from "@/lib/community/permissions";
import {
  COMMUNITY_FEED_PAGE_SIZE,
  getUnitPosts,
} from "@/lib/db/queries/community-posts";

/** One page of a unit's posts, in the requested sort and filter. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ unitId: string }> },
) {
  const { unitId } = await params;
  const id = Number(unitId);
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
  if (!canSeeUnit(ctx, id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const search = new URL(request.url).searchParams;
  const offset = Math.max(0, Number(search.get("offset") ?? 0) || 0);
  const view = parseFeedView({
    sort: search.get("sort"),
    filter: search.get("filter"),
  });

  const posts = await getUnitPosts(id, ctx, { offset, view });
  const nextOffset =
    posts.length === COMMUNITY_FEED_PAGE_SIZE ? offset + posts.length : null;

  return NextResponse.json({ posts, nextOffset });
}
