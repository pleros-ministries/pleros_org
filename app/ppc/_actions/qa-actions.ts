"use server";

import { revalidatePath } from "next/cache";
import {
  createThread,
  addMessage,
  closeThread,
  getThreadMessages,
} from "@/lib/db/queries/qa";
import { requireAuth, requireStaff } from "@/lib/auth/require-role";

export async function createQaThread(data: {
  userId: string;
  lessonId: number;
  subject: string;
  message: string;
  authorRole: "student" | "instructor" | "admin";
}) {
  await requireAuth();
  const thread = await createThread(data);
  revalidatePath("/ppc", "layout");
  return thread;
}

export async function replyToThread(data: {
  threadId: number;
  authorId: string;
  authorRole: "student" | "instructor" | "admin";
  content: string;
}) {
  await requireAuth();
  const message = await addMessage(data);
  revalidatePath("/ppc", "layout");
  return message;
}

export async function closeQaThread(threadId: number) {
  await requireStaff();
  await closeThread(threadId);
  revalidatePath("/ppc", "layout");
}

export async function fetchThreadMessages(threadId: number) {
  await requireAuth();
  const messages = await getThreadMessages(threadId);
  return messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));
}
