import { notFound, redirect } from "next/navigation";

import { MessageThread } from "@/components/community/messages/message-thread";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { DM_PAGE_SIZE } from "@/lib/community/messaging";
import {
  getConversationForUser,
  listMessages,
} from "@/lib/db/queries/community-messages";

export default async function CommunityConversationRoute({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = await params;
  const id = Number(conversationId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  // Session and context load together instead of one roundtrip after the other.
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) {
    redirect(`/login?returnTo=/dashboard/community/messages/${id}`);
  }
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  // Only the two participants can open a conversation.
  const conversation = await getConversationForUser(ctx.userId, id);
  if (!conversation) notFound();

  const messages = await listMessages(ctx.userId, id);

  return (
    <MessageThread
      key={conversation.id}
      conversation={conversation}
      initialMessages={messages}
      hasEarlier={messages.length === DM_PAGE_SIZE}
    />
  );
}
