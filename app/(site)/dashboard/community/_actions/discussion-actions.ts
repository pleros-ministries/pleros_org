"use server";

import { revalidatePath } from "next/cache";

import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
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
