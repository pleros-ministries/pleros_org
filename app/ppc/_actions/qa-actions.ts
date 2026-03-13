"use server";

import { createThread, addMessage } from "@/lib/db/queries/qa";

export async function createQaThread(data: {
  userId: string;
  lessonId: number;
  subject: string;
  content: string;
  authorRole: "student" | "instructor" | "admin";
}) {
  const thread = await createThread(data);
  return { success: true, thread };
}

export async function replyToThread(data: {
  threadId: number;
  authorId: string;
  authorRole: "student" | "instructor" | "admin";
  content: string;
}) {
  const message = await addMessage(data);
  return { success: true, message };
}
