import { NextResponse } from "next/server";

import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { getUnitDetail } from "@/lib/db/queries/community-units";
import { getUnitPosts } from "@/lib/db/queries/community-posts";

export async function GET(
  _request: Request,
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
  if (ctx.unit?.id !== id && !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [detail, posts] = await Promise.all([
    getUnitDetail(id),
    getUnitPosts(id, ctx),
  ]);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ detail, posts });
}
