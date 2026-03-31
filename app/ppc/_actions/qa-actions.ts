"use server";

import { revalidatePath } from "next/cache";
import {
  createThread,
  addMessage,
  closeThread,
  getThreadById,
  getThreadMessages,
  reopenThread,
  setThreadAssignment,
} from "@/lib/db/queries/qa";
import { requireAuth, requireStaff, requireStudent } from "@/lib/auth/require-role";
import { getSignedInActor, getStudentSelfActor } from "@/lib/auth/action-actor";
import { assertCanAccessQaThread } from "@/lib/auth/qa-access";
import { db } from "@/lib/db";
import { notifyQaAssignment } from "@/lib/notifications/staff-assignment";

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

export async function updateQaThreadAssignment(
  threadId: number,
  assignedToId: string | null,
) {
  const session = await requireStaff();
  const thread = await getThreadById(threadId);
  if (!thread) {
    throw new Error("Thread not found");
  }

  const actingUserId = session.user.id;
  const actingRole = session.user.role;

  const previousAssignedToId = thread.assignedTo;
  let assignee:
    | {
        id: string;
        name: string;
        email: string;
        role: "admin" | "instructor" | "student";
      }
    | null = null;

  if (assignedToId) {
    assignee =
      (await db.query.users.findFirst({
        where: (user, { eq }) => eq(user.id, assignedToId),
      })) ?? null;

    if (
      !assignee ||
      (assignee.role !== "admin" && assignee.role !== "instructor")
    ) {
      throw new Error("Assignee must be a staff member");
    }
  }

  if (actingRole !== "admin") {
    if (assignedToId && assignedToId !== actingUserId) {
      throw new Error("Forbidden: instructors can only assign threads to themselves");
    }

    if (assignedToId == null && thread.assignedTo !== actingUserId) {
      throw new Error("Forbidden: instructors can only clear their own assignments");
    }
  }

  await setThreadAssignment(threadId, assignedToId);

  if (assignedToId && assignee) {
    const [student, lesson] = await Promise.all([
      db.query.users.findFirst({
        where: (user, { eq }) => eq(user.id, thread.userId),
      }),
      db.query.lessons.findFirst({
        where: (lesson, { eq }) => eq(lesson.id, thread.lessonId),
      }),
    ]);

    if (student && lesson) {
      await notifyQaAssignment({
        actorId: actingUserId,
        previousAssignedToId,
        nextAssignedToId: assignedToId,
        assignee,
        studentName: student.name,
        threadSubject: thread.subject,
        lessonTitle: lesson.title,
        lessonNumber: lesson.lessonNumber,
        levelId: lesson.levelId,
      });
    }
  }

  revalidateQaSurfaces();
}
