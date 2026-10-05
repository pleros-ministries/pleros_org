import { NextResponse } from "next/server";

import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import {
  listSuggestedContacts,
  searchMembers,
} from "@/lib/db/queries/community-messages";

/**
 * People the viewer can start a conversation with: suggested contacts when
 * `q` is empty, otherwise a first-name search.
 */
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

  const query = (new URL(request.url).searchParams.get("q") ?? "").trim();
  const members =
    query.length >= 2
      ? await searchMembers(ctx, query)
      : await listSuggestedContacts(ctx);

  return NextResponse.json({ members, canSearch: !ctx.isMinor });
}
