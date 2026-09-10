import { notFound, redirect } from "next/navigation";

import { CommunityUnitPage } from "@/components/community/community-unit-page";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import {
  getUnitDetail,
  listUnitMembersForAdmin,
} from "@/lib/db/queries/community-units";
import { getUnitPosts } from "@/lib/db/queries/community-posts";

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

  const ownUnit = ctx.unit?.id === id;
  if (!ownUnit && !ctx.isAdmin) {
    redirect(
      ctx.unit ? `/dashboard/community/unit/${ctx.unit.id}` : "/dashboard/community",
    );
  }

  const [detail, posts, adminMembers] = await Promise.all([
    getUnitDetail(id),
    getUnitPosts(id, ctx),
    ctx.isAdmin ? listUnitMembersForAdmin(id) : Promise.resolve([]),
  ]);
  if (!detail) notFound();

  return (
    <CommunityUnitPage
      detail={detail}
      posts={posts}
      isAdmin={ctx.isAdmin}
      canLead={ownUnit && ctx.isUnitLeader}
      adminMembers={adminMembers}
    />
  );
}
