import { redirect } from "next/navigation";

import { CommunityHub } from "@/components/community/community-hub";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { getCommunityFeed } from "@/lib/db/queries/community-posts";

export default async function CommunityRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const feed = await getCommunityFeed(ctx);

  return (
    <CommunityHub
      initialFeed={feed}
      unit={ctx.unit}
      isUnitLeader={ctx.isUnitLeader}
      isAdmin={ctx.isAdmin}
    />
  );
}
