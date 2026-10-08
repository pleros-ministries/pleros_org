"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import type { CommunityContext } from "@/lib/community/context";
import {
  CommunityError,
  type CommunityActionResult,
} from "@/lib/community/errors";
import {
  messageDenialCopy,
  normaliseMessageBody,
} from "@/lib/community/messaging";
import {
  assertCanSendMessage,
  assertCanStartConversation,
  RateLimitError,
} from "@/lib/community/rate-limit";
import {
  blockUser,
  checkCanMessage,
  findConversationId,
  findOrCreateConversation,
  getConversationPartnerId,
  getMessageMeta,
  isConversationUnstarted,
  markConversationRead,
  sendMessage,
  unblockUser,
  type DirectMessage,
} from "@/lib/db/queries/community-messages";
import { flagContent } from "@/lib/db/queries/community-posts";
import { sendPushToUser } from "@/lib/push/send";

async function requireCommunity(): Promise<CommunityContext> {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) throw new Error("Forbidden");
  return ctx;
}

/** Returns expected failures as data; thrown messages are hidden in production. */
async function run<T extends object>(
  fn: () => Promise<T>,
): Promise<CommunityActionResult<T>> {
  try {
    return { ok: true as const, ...(await fn()) };
  } catch (error) {
    if (error instanceof CommunityError || error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * Opens the conversation with another member. An existing conversation always
 * opens (its history stays readable); a new one needs the messaging rules to
 * allow it.
 */
export async function openConversation(
  recipientId: string,
): Promise<CommunityActionResult<{ conversationId: number }>> {
  return run(async () => {
    const ctx = await requireCommunity();
    if (typeof recipientId !== "string" || !recipientId) {
      throw new CommunityError("You can't message this person.");
    }

    const existing = await findConversationId(ctx.userId, recipientId);
    if (existing != null) return { conversationId: existing };

    const check = await checkCanMessage(ctx.userId, recipientId);
    if (!check.decision.ok) {
      throw new CommunityError(messageDenialCopy(check.decision.reason));
    }
    return {
      conversationId: await findOrCreateConversation(ctx.userId, recipientId),
    };
  });
}

export async function sendDirectMessage(input: {
  conversationId: number;
  body: string;
}): Promise<CommunityActionResult<{ message: DirectMessage }>> {
  return run(async () => {
    const ctx = await requireCommunity();

    const recipientId = await getConversationPartnerId(
      ctx.userId,
      input.conversationId,
    );
    if (!recipientId) {
      throw new CommunityError("This conversation is no longer available.");
    }

    const parsed = normaliseMessageBody(input.body);
    if (!parsed.ok) throw new CommunityError(parsed.error);

    const check = await checkCanMessage(ctx.userId, recipientId);
    if (!check.decision.ok) {
      throw new CommunityError(messageDenialCopy(check.decision.reason));
    }

    await assertCanSendMessage(ctx.userId);
    if (await isConversationUnstarted(input.conversationId)) {
      await assertCanStartConversation(ctx.userId);
    }

    const { message, notifyRecipient } = await sendMessage({
      conversationId: input.conversationId,
      senderId: ctx.userId,
      recipientId,
      body: parsed.body,
    });

    if (notifyRecipient) {
      // Push text names the sender only — never the message itself.
      after(() =>
        sendPushToUser(
          recipientId,
          {
            title: "New message",
            body: `${check.senderFirstName} sent you a message.`,
            url: `/dashboard/community/messages/${input.conversationId}`,
          },
          { gate: "community" },
        ).catch((error) => console.error("Message push failed:", error)),
      );
    }

    return { message };
  });
}

export async function markConversationSeen(input: {
  conversationId: number;
  upToId: number;
}) {
  const ctx = await requireCommunity();
  if (!Number.isInteger(input.conversationId) || !Number.isInteger(input.upToId)) {
    return;
  }
  await markConversationRead(ctx.userId, input.conversationId, input.upToId);
}

/** Stops private messages between the two members in both directions. */
export async function blockMember(
  userId: string,
): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    if (typeof userId !== "string" || !userId || userId === ctx.userId) {
      throw new CommunityError("You can't block this person.");
    }
    await blockUser(ctx.userId, userId);
    return {};
  });
}

export async function unblockMember(
  userId: string,
): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    await unblockUser(ctx.userId, userId);
    return {};
  });
}

/**
 * Reports one message the reporter received. Only that message reaches the
 * admin moderation queue — never the rest of the conversation.
 */
export async function reportMessage(input: {
  messageId: number;
  reason: string;
}): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();

    const message = await getMessageMeta(input.messageId);
    const partnerId = message
      ? await getConversationPartnerId(ctx.userId, message.conversationId)
      : null;
    if (!message || !partnerId || message.status !== "visible") {
      throw new CommunityError("This message is no longer available.");
    }
    if (message.senderId === ctx.userId) {
      throw new CommunityError("You can't report your own message.");
    }

    await flagContent({
      targetType: "message",
      targetId: message.id,
      reason: input.reason,
      reporterId: ctx.userId,
    });
    revalidatePath("/admin/community");
    return {};
  });
}
