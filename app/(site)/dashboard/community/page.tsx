import { redirect } from "next/navigation";

import { CommunityHub } from "@/components/community/community-hub";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import {
  COMMUNITY_FEED_PAGE_SIZE,
  getCommunityFeed,
} from "@/lib/db/queries/community-posts";

export default async function CommunityRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const feed = await getCommunityFeed(ctx);
  const initialNextOffset =
    feed.length === COMMUNITY_FEED_PAGE_SIZE ? feed.length : null;

  return (
    <CommunityHub
      initialFeed={feed}
      initialNextOffset={initialNextOffset}
      viewerName={session.user.name ?? "You"}
      unit={ctx.unit}
      isUnitLeader={ctx.isUnitLeader}
      isAdmin={ctx.isAdmin}
    />
  );
}
