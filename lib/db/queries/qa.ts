import { eq, and, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "../schema";

export async function getThreadsByLesson(lessonId: number, userId?: string) {
  const conditions = [eq(schema.qaThreads.lessonId, lessonId)];
  if (userId) conditions.push(eq(schema.qaThreads.userId, userId));

  return db
    .select()
    .from(schema.qaThreads)
    .where(and(...conditions))
    .orderBy(desc(schema.qaThreads.createdAt));
}

export async function getThreadsByUser(userId: string) {
  return db
    .select()
    .from(schema.qaThreads)
    .where(eq(schema.qaThreads.userId, userId))
    .orderBy(desc(schema.qaThreads.createdAt));
}

export async function getAllThreads(status?: "open" | "answered" | "closed") {
  const threads = status
    ? await db
        .select({
          id: schema.qaThreads.id,
          userId: schema.qaThreads.userId,
          lessonId: schema.qaThreads.lessonId,
          subject: schema.qaThreads.subject,
          status: schema.qaThreads.status,
          createdAt: schema.qaThreads.createdAt,
          studentName: schema.users.name,
          studentEmail: schema.users.email,
          lessonTitle: schema.lessons.title,
          levelId: schema.lessons.levelId,
          lessonNumber: schema.lessons.lessonNumber,
        })
        .from(schema.qaThreads)
        .innerJoin(schema.users, eq(schema.qaThreads.userId, schema.users.id))
        .innerJoin(schema.lessons, eq(schema.qaThreads.lessonId, schema.lessons.id))
        .where(eq(schema.qaThreads.status, status))
        .orderBy(desc(schema.qaThreads.createdAt))
    : await db
        .select({
          id: schema.qaThreads.id,
          userId: schema.qaThreads.userId,
          lessonId: schema.qaThreads.lessonId,
          subject: schema.qaThreads.subject,
          status: schema.qaThreads.status,
          createdAt: schema.qaThreads.createdAt,
          studentName: schema.users.name,
          studentEmail: schema.users.email,
          lessonTitle: schema.lessons.title,
          levelId: schema.lessons.levelId,
          lessonNumber: schema.lessons.lessonNumber,
        })
        .from(schema.qaThreads)
        .innerJoin(schema.users, eq(schema.qaThreads.userId, schema.users.id))
        .innerJoin(schema.lessons, eq(schema.qaThreads.lessonId, schema.lessons.id))
        .orderBy(desc(schema.qaThreads.createdAt));

  return threads;
}

export async function getThreadMessages(threadId: number) {
  return db
    .select({
      id: schema.qaMessages.id,
      threadId: schema.qaMessages.threadId,
      authorId: schema.qaMessages.authorId,
      authorRole: schema.qaMessages.authorRole,
      content: schema.qaMessages.content,
      createdAt: schema.qaMessages.createdAt,
      authorName: schema.users.name,
    })
    .from(schema.qaMessages)
    .innerJoin(schema.users, eq(schema.qaMessages.authorId, schema.users.id))
    .where(eq(schema.qaMessages.threadId, threadId))
    .orderBy(schema.qaMessages.createdAt);
}

export async function createThread(data: {
  userId: string;
  lessonId: number;
  subject: string;
  message: string;
  authorRole: "student" | "instructor" | "admin";
}) {
  const [thread] = await db
    .insert(schema.qaThreads)
    .values({
      userId: data.userId,
      lessonId: data.lessonId,
      subject: data.subject,
    })
    .returning();

  if (thread) {
    await db.insert(schema.qaMessages).values({
      threadId: thread.id,
      authorId: data.userId,
      authorRole: data.authorRole,
      content: data.message,
    });
  }

  return thread;
}

export async function addMessage(data: {
  threadId: number;
  authorId: string;
  authorRole: "student" | "instructor" | "admin";
  content: string;
}) {
  const [message] = await db
    .insert(schema.qaMessages)
    .values(data)
    .returning();

  const newStatus = data.authorRole === "student" ? "open" : "answered";
  await db
    .update(schema.qaThreads)
    .set({ status: newStatus })
    .where(eq(schema.qaThreads.id, data.threadId));

  return message;
}

export async function closeThread(threadId: number) {
  await db
    .update(schema.qaThreads)
    .set({ status: "closed" })
    .where(eq(schema.qaThreads.id, threadId));
}
