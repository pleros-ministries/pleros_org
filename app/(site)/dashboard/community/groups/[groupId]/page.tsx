import { notFound, redirect } from "next/navigation";

import { CommunityGroupPage } from "@/components/community/groups/community-group-page";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { getGroupDetail } from "@/lib/db/queries/community-groups";
import {
  COMMUNITY_FEED_PAGE_SIZE,
  getGroupPosts,
} from "@/lib/db/queries/community-posts";

export default async function CommunityGroupRoute({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const id = Number(groupId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const session = await getAppSession();
  if (!session) {
    redirect(`/login?returnTo=/dashboard/community/groups/${id}`);
  }

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const detail = await getGroupDetail(id, ctx);
  if (!detail) notFound();

  // `getGroupPosts` returns nothing for a private group the viewer is not in.
  const posts = detail.viewer.canView ? await getGroupPosts(id, ctx) : [];

  return (
    <CommunityGroupPage
      key={`${detail.id}-${detail.viewer.canView}-${detail.viewer.isMember}`}
      detail={detail}
      initialPosts={posts}
      initialNextOffset={
        posts.length === COMMUNITY_FEED_PAGE_SIZE ? posts.length : null
      }
      viewerName={session.user.name ?? "You"}
      isAdmin={ctx.isAdmin}
      postingBlocked={ctx.postingBlocked}
    />
  );
}
