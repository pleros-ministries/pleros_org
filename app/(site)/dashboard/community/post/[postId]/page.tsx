import { notFound, redirect } from "next/navigation";

import { PostDetail } from "@/components/community/post-detail";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { canPostOfficialAnywhere } from "@/lib/community/permissions";
import { getPost } from "@/lib/db/queries/community-posts";

export default async function CommunityPostRoute({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const id = Number(postId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const session = await getAppSession();
  if (!session) {
    redirect(`/login?returnTo=/dashboard/community/post/${id}`);
  }

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const post = await getPost(ctx, id);
  if (!post) notFound();

  // In a discipleship space only the discipler moderates, admin or not.
  const moderatesAsAdmin = ctx.isAdmin && post.scope !== "discipleship";

  return (
    <PostDetail
      post={post}
      viewerName={session.user.name ?? "You"}
      viewerUnitName={ctx.unit?.name ?? null}
      canRepost={canPostOfficialAnywhere(ctx)}
      isAdmin={moderatesAsAdmin}
    />
  );
}
