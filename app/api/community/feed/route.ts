import { NextResponse } from "next/server";

import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
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

  const offset = Math.max(
    0,
    Number(new URL(request.url).searchParams.get("offset") ?? 0) || 0,
  );

  const posts = await getCommunityFeed(ctx, { offset });
  const nextOffset =
    posts.length === COMMUNITY_FEED_PAGE_SIZE ? offset + posts.length : null;

  return NextResponse.json({
    posts,
    nextOffset,
    ...(offset === 0
      ? {
          sidebar: await getCommunitySidebar(ctx),
          unit: ctx.unit,
          isUnitLeader: ctx.isUnitLeader,
          isAdmin: ctx.isAdmin,
        }
      : {}),
  });
}
