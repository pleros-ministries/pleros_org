import { redirect } from "next/navigation";

import { DiscussionList } from "@/components/community/discussion-list";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { listThreads } from "@/lib/db/queries/community-discussion";

export default async function CommunityDiscussionRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/discussion");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const threads = await listThreads(ctx);

  return (
    <DiscussionList
      threads={threads}
      unitId={ctx.unit?.id ?? null}
      unitName={ctx.unit?.name ?? null}
      showLeaderTab={ctx.isUnitLeader || ctx.isAdmin}
    />
  );
}
