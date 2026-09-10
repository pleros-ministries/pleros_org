import { notFound, redirect } from "next/navigation";

import { ThreadView } from "@/components/community/thread-view";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { getThread } from "@/lib/db/queries/community-discussion";

export default async function CommunityThreadRoute({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const id = Number(threadId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const session = await getAppSession();
  if (!session) {
    redirect(`/login?returnTo=/dashboard/community/discussion/${id}`);
  }

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  const thread = await getThread(ctx, id);
  if (!thread) notFound();

  return <ThreadView thread={thread} />;
}
