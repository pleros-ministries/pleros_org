"use server";

import { revalidatePath } from "next/cache";
import {
  createThread,
  addMessage,
  closeThread,
  getThreadById,
  getThreadMessages,
  reopenThread,
} from "@/lib/db/queries/qa";
import { requireAuth, requireStaff, requireStudent } from "@/lib/auth/require-role";
import { getSignedInActor, getStudentSelfActor } from "@/lib/auth/action-actor";
import { assertCanAccessQaThread } from "@/lib/auth/qa-access";

function revalidateQaSurfaces() {
  revalidatePath("/ppc", "layout");
  revalidatePath("/admin", "layout");
}

export async function createQaThread(data: {
  lessonId: number;
  subject: string;
  message: string;
}) {
  const session = await requireStudent();
  const { userId, authorRole } = getStudentSelfActor(session);
  const thread = await createThread({
    userId,
    lessonId: data.lessonId,
    subject: data.subject,
    message: data.message,
    authorRole,
  });
  revalidateQaSurfaces();
  return thread;
}

export async function replyToThread(data: {
  threadId: number;
  content: string;
}) {
  const session = await requireAuth();
  const thread = await getThreadById(data.threadId);
  if (!thread) {
    throw new Error("Thread not found");
  }
  assertCanAccessQaThread(session, thread);
  const { authorId, authorRole } = getSignedInActor(session);
  const message = await addMessage({
    threadId: data.threadId,
    authorId,
    authorRole,
    content: data.content,
  });
  revalidateQaSurfaces();
  return message;
}

export async function closeQaThread(threadId: number) {
  await requireStaff();
  await closeThread(threadId);
  revalidateQaSurfaces();
}

export async function reopenQaThread(threadId: number) {
  await requireStaff();
  await reopenThread(threadId);
  revalidateQaSurfaces();
}

export async function fetchThreadMessages(threadId: number) {
  const session = await requireAuth();
  const thread = await getThreadById(threadId);
  if (!thread) {
    throw new Error("Thread not found");
  }
  assertCanAccessQaThread(session, thread);
  const messages = await getThreadMessages(threadId);
  return messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));
}
