import { NextResponse } from "next/server";
import { getCommunityContext } from "@/lib/community/context";
import { canAccessReporting } from "@/lib/community/reporting-access";
import { CommunityError } from "@/lib/community/errors";
import { listSharedChurchMeetings } from "@/lib/db/queries/shared-church-meetings";

export async function GET(request: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const ctx = await getCommunityContext();
  if (!ctx || !await canAccessReporting(ctx)) return NextResponse.json({ error: "Reporting access required." }, { status: 403, headers });
  const params = new URL(request.url).searchParams;
  try { return NextResponse.json(await listSharedChurchMeetings(ctx.userId, Number(params.get("unit")), params.get("day") ?? ""), { headers }); }
  catch (error) { if (error instanceof CommunityError) return NextResponse.json({ error: error.message }, { status: 403, headers }); throw error; }
}
