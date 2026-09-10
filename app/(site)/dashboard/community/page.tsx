import { redirect } from "next/navigation";

import { CommunityHub } from "@/components/community/community-hub";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import {
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

  return (
    <CommunityHub
      initialFeed={feed}
      sidebar={sidebar}
      viewerName={session.user.name ?? "You"}
      unit={ctx.unit}
      isUnitLeader={ctx.isUnitLeader}
      isAdmin={ctx.isAdmin}
    />
  );
}
