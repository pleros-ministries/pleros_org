import { notFound, redirect } from "next/navigation";

import { CommunityUnitPage } from "@/components/community/community-unit-page";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { canSeeUnit, managesUnit } from "@/lib/community/permissions";
import {
  getUnitDetail,
  listUnitMembersForAdmin,
} from "@/lib/db/queries/community-units";
import {
  COMMUNITY_FEED_PAGE_SIZE,
  getUnitPosts,
} from "@/lib/db/queries/community-posts";

export default async function CommunityUnitRoute({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const id = Number(unitId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const session = await getAppSession();
  if (!session) {
    redirect(`/login?returnTo=/dashboard/community/unit/${id}`);
  }

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  // A location group is open to its members, the pastor assigned to it, its
  // member leader and admins.
  if (!canSeeUnit(ctx, id)) {
    redirect(
      ctx.unit ? `/dashboard/community/unit/${ctx.unit.id}` : "/dashboard/community",
    );
  }

  const [detail, posts, adminMembers] = await Promise.all([
    getUnitDetail(id, ctx),
    getUnitPosts(id, ctx),
    ctx.isAdmin ? listUnitMembersForAdmin(id) : Promise.resolve([]),
  ]);
  if (!detail) notFound();

  const manages = managesUnit(ctx, id);

  return (
    <CommunityUnitPage
      detail={detail}
      initialPosts={posts}
      initialNextOffset={
        posts.length === COMMUNITY_FEED_PAGE_SIZE ? posts.length : null
      }
      viewerName={session.user.name ?? "You"}
      isAdmin={ctx.isAdmin}
      canPost
      canRepost={manages}
      officialReach={manages ? "all" : "none"}
      postingBlocked={ctx.postingBlocked}
      adminMembers={adminMembers}
    />
  );
}
