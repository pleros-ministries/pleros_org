import { NextResponse } from "next/server";

import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import {
  getCommunityFeed,
  getCommunitySidebar,
} from "@/lib/db/queries/community-posts";

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

  const [posts, sidebar] = await Promise.all([
    getCommunityFeed(ctx),
    getCommunitySidebar(ctx),
  ]);
  return NextResponse.json({
    posts,
    sidebar,
    unit: ctx.unit,
    isUnitLeader: ctx.isUnitLeader,
    isAdmin: ctx.isAdmin,
  });
}
