import { NextResponse } from "next/server";

import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { isDefaultFeedView, parseFeedView } from "@/lib/community/feed-view";
import {
  COMMUNITY_FEED_PAGE_SIZE,
  getCommunityFeed,
  getCommunitySidebar,
} from "@/lib/db/queries/community-posts";

export async function GET(request: Request) {
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

  const params = new URL(request.url).searchParams;
  const offset = Math.max(0, Number(params.get("offset") ?? 0) || 0);
  const view = parseFeedView({
    sort: params.get("sort"),
    filter: params.get("filter"),
  });

  const posts = await getCommunityFeed(ctx, { offset, view });
  const nextOffset =
    posts.length === COMMUNITY_FEED_PAGE_SIZE ? offset + posts.length : null;

  return NextResponse.json({
    posts,
    nextOffset,
    ...(offset === 0 && isDefaultFeedView(view)
      ? {
          sidebar: await getCommunitySidebar(ctx),
          unit: ctx.unit,
          isUnitLeader: ctx.isUnitLeader,
          isAdmin: ctx.isAdmin,
        }
      : {}),
  });
}
