import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "../index";
import { qaThreads, qaMessages, users, lessons } from "../schema";

export async function listThreadsForLesson(lessonId: number, userId?: string) {
  const conditions = [eq(qaThreads.lessonId, lessonId)];
  if (userId) conditions.push(eq(qaThreads.userId, userId));

  return db
    .select({
      thread: qaThreads,
      studentName: users.name,
    })
    .from(qaThreads)
    .innerJoin(users, eq(qaThreads.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(qaThreads.createdAt));
}

export async function listAllThreads(status?: "open" | "answered" | "closed") {
  const conditions = status ? [eq(qaThreads.status, status)] : [];

  return db
    .select({
      thread: qaThreads,
      studentName: users.name,
      studentEmail: users.email,
      lessonNumber: lessons.lessonNumber,
      levelId: lessons.levelId,
    })
    .from(qaThreads)
    .innerJoin(users, eq(qaThreads.userId, users.id))
    .innerJoin(lessons, eq(qaThreads.lessonId, lessons.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(qaThreads.createdAt));
}

export async function listThreadsForStudent(userId: string) {
  return db
    .select({
      thread: qaThreads,
      lessonNumber: lessons.lessonNumber,
      levelId: lessons.levelId,
    })
    .from(qaThreads)
    .innerJoin(lessons, eq(qaThreads.lessonId, lessons.id))
    .where(eq(qaThreads.userId, userId))
    .orderBy(desc(qaThreads.createdAt));
}

export async function getThreadMessages(threadId: number) {
  return db
    .select({
      message: qaMessages,
      authorName: users.name,
    })
    .from(qaMessages)
    .innerJoin(users, eq(qaMessages.authorId, users.id))
    .where(eq(qaMessages.threadId, threadId))
    .orderBy(asc(qaMessages.createdAt));
}

export async function createThread(data: {
  userId: string;
  lessonId: number;
  subject: string;
  content: string;
  authorRole: "student" | "instructor" | "admin";
}) {
  const [thread] = await db
    .insert(qaThreads)
    .values({
      userId: data.userId,
      lessonId: data.lessonId,
      subject: data.subject,
    })
    .returning();

  await db.insert(qaMessages).values({
    threadId: thread.id,
    authorId: data.userId,
    authorRole: data.authorRole,
    content: data.content,
  });

  return thread;
}

export async function addMessage(data: {
  threadId: number;
  authorId: string;
  authorRole: "student" | "instructor" | "admin";
  content: string;
}) {
  const [msg] = await db.insert(qaMessages).values(data).returning();

  const newStatus = data.authorRole === "student" ? "open" : "answered";
  await db
    .update(qaThreads)
    .set({ status: newStatus })
    .where(eq(qaThreads.id, data.threadId));

  return msg;
}
