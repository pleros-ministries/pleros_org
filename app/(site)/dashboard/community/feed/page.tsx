import { redirect } from "next/navigation";
import { CommunityHub } from "@/components/community/community-hub";
import { CommunitySidebar } from "@/components/community/community-sidebar";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { managesUnit } from "@/lib/community/permissions";
import { COMMUNITY_FEED_PAGE_SIZE, getCommunityFeed, getCommunitySidebar } from "@/lib/db/queries/community-posts";

// Reads the session on every request (Cache Components).
export const instant = false;

/** Retained feed behaviour, separate from the Paper Community home. */
export default async function CommunityFeedRoute() {
  // Session and context load together instead of one roundtrip after the other.
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect("/login?returnTo=/dashboard/community/feed");
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");
  const [feed, sidebar] = await Promise.all([getCommunityFeed(ctx), getCommunitySidebar(ctx)]);
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
    <div className="min-w-0"><CommunityHub initialFeed={feed} initialNextOffset={feed.length === COMMUNITY_FEED_PAGE_SIZE ? feed.length : null} viewerName={session.user.name ?? "You"} unit={ctx.unit} isUnitLeader={managesUnit(ctx, ctx.unit?.id)} isAdmin={ctx.isAdmin} postingBlocked={ctx.postingBlocked} /></div>
    <CommunitySidebar data={sidebar} />
  </div>;
}
