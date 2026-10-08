import { redirect } from "next/navigation";

import { CommunityDiscipleshipView } from "@/components/community/community-discipleship";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { getCommunityDiscipleship } from "@/lib/db/queries/community-discipleship";
import {
  COMMUNITY_FEED_PAGE_SIZE,
  getDiscipleshipPosts,
} from "@/lib/db/queries/community-posts";

export default async function CommunityDiscipleshipRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/discipleship");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const data = await getCommunityDiscipleship(ctx);

  // Load the first page for the group shown first: the one the learner
  // joined, otherwise the first group they lead that has disciples.
  const ledGroup =
    data.leading.find((group) => !group.paused && group.disciples.length > 0) ??
    null;
  const initialGroupId = data.joined?.groupId ?? ledGroup?.groupId ?? null;
  const initialPosts =
    initialGroupId != null ? await getDiscipleshipPosts(initialGroupId, ctx) : [];

  return (
    <CommunityDiscipleshipView
      data={data}
      viewerName={session.user.name ?? "You"}
      initialGroupId={initialGroupId}
      initialPosts={initialPosts}
      initialNextOffset={
        initialPosts.length === COMMUNITY_FEED_PAGE_SIZE
          ? initialPosts.length
          : null
      }
      postingBlocked={ctx.postingBlocked}
    />
  );
}
