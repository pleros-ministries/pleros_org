"use server";

import { after } from "next/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { notifyThreadReply } from "@/lib/community/notify";
import {
  assertCanModerateThread,
  createThread,
  flagContent,
  getThread,
  messageThreadId,
  postMessage,
  setMessageStatus,
  setThreadStatus,
  toggleMessageReaction,
} from "@/lib/db/queries/community-discussion";

async function requireCommunity() {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) throw new Error("Forbidden");
  return ctx;
}

export async function startDiscussion(input: {
  scope: "global" | "unit";
  title: string;
  body: string;
}) {
  const ctx = await requireCommunity();
  const thread = await createThread(ctx, input);
  revalidatePath("/dashboard/community/discussion");
  return thread;
}

export async function replyInThread(input: {
  threadId: number;
  body: string;
  replyToId?: number | null;
}) {
  const ctx = await requireCommunity();
  await postMessage(ctx, input);

  const [thread] = await db
    .select({ title: schema.communityThreads.title })
    .from(schema.communityThreads)
    .where(eq(schema.communityThreads.id, input.threadId))
    .limit(1);
  let replyToAuthorId: string | null = null;
  if (input.replyToId) {
    const [parent] = await db
      .select({ authorId: schema.communityMessages.authorId })
      .from(schema.communityMessages)
      .where(eq(schema.communityMessages.id, input.replyToId))
      .limit(1);
    replyToAuthorId = parent?.authorId ?? null;
  }
  if (thread) {
    after(() =>
      notifyThreadReply({
        threadId: input.threadId,
        threadTitle: thread.title,
        actorId: ctx.userId,
        replyToAuthorId,
      }).catch((error) =>
        console.error("Thread-reply notification failed:", error),
      ),
    );
  }

  revalidatePath(`/dashboard/community/discussion/${input.threadId}`);
}

export async function reactInThread(input: {
  threadId: number;
  messageId: number;
}) {
  const ctx = await requireCommunity();
  const result = await toggleMessageReaction({
    messageId: input.messageId,
    userId: ctx.userId,
  });
  revalidatePath(`/dashboard/community/discussion/${input.threadId}`);
  return result;
}

export async function reportContent(input: {
  targetType: "post" | "thread" | "message";
  targetId: number;
  reason: string;
}) {
  const ctx = await requireCommunity();
  await flagContent({ ...input, reporterId: ctx.userId });
  revalidatePath("/dashboard/community");
}

export async function moderateThread(input: {
  threadId: number;
  action: "lock" | "unlock" | "remove";
}) {
  const ctx = await requireCommunity();
  await assertCanModerateThread(ctx, input.threadId);
  await setThreadStatus(
    input.threadId,
    input.action === "lock"
      ? "locked"
      : input.action === "unlock"
        ? "open"
        : "removed",
  );
  revalidatePath(`/dashboard/community/discussion/${input.threadId}`);
  revalidatePath("/dashboard/community/discussion");
}

export async function moderateMessage(input: {
  messageId: number;
  action: "hide" | "remove" | "restore";
}) {
  const ctx = await requireCommunity();
  const threadId = await messageThreadId(input.messageId);
  if (threadId == null) throw new Error("Message not found");
  await assertCanModerateThread(ctx, threadId);
  await setMessageStatus(
    input.messageId,
    input.action === "hide"
      ? "hidden"
      : input.action === "remove"
        ? "removed"
        : "visible",
  );
  revalidatePath(`/dashboard/community/discussion/${threadId}`);
}

/** Load a thread for the client after a mutation without a full refresh. */
export async function loadThread(threadId: number) {
  const ctx = await requireCommunity();
  return getThread(ctx, threadId);
}
