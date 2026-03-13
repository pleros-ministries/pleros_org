"use server";

import { revalidatePath } from "next/cache";
import {
  createThread,
  addMessage,
  closeThread,
  getThreadMessages,
} from "@/lib/db/queries/qa";

export async function createQaThread(data: {
  userId: string;
  lessonId: number;
  subject: string;
  message: string;
  authorRole: "student" | "instructor" | "admin";
}) {
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
  const message = await addMessage(data);
  revalidatePath("/ppc", "layout");
  return message;
}

export async function closeQaThread(threadId: number) {
  await closeThread(threadId);
  revalidatePath("/ppc", "layout");
}

export async function fetchThreadMessages(threadId: number) {
  const messages = await getThreadMessages(threadId);
  return messages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));
}
