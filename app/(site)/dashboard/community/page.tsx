import { redirect } from "next/navigation";

import { CommunityHub } from "@/components/community/community-hub";
import { CommunitySidebar } from "@/components/community/community-sidebar";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { managesUnit } from "@/lib/community/permissions";
import {
  COMMUNITY_FEED_PAGE_SIZE,
  getCommunityFeed,
  getCommunitySidebar,
} from "@/lib/db/queries/community-posts";

export default async function CommunityRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const [feed, sidebar] = await Promise.all([
    getCommunityFeed(ctx),
    getCommunitySidebar(ctx),
  ]);
  const initialNextOffset =
    feed.length === COMMUNITY_FEED_PAGE_SIZE ? feed.length : null;

  // "Latest posts" and "Active discussions" sit beside the feed and nowhere else.
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
      <div className="min-w-0">
        <CommunityHub
          initialFeed={feed}
          initialNextOffset={initialNextOffset}
          viewerName={session.user.name ?? "You"}
          unit={ctx.unit}
          isUnitLeader={managesUnit(ctx, ctx.unit?.id)}
          isAdmin={ctx.isAdmin}
          postingBlocked={ctx.postingBlocked}
        />
      </div>
      <CommunitySidebar data={sidebar} />
    </div>
  );
}
