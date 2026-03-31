"use server";

import { revalidatePath } from "next/cache";
import {
  upsertDraft,
  submitForReview,
  approveSubmission,
  requestRevision,
  getSubmissionById,
  setSubmissionAssignment,
} from "@/lib/db/queries/submissions";
import { sendSubmissionReviewed } from "@/lib/email/send";
import { db } from "@/lib/db";
import { requireAuth, requireStaff } from "@/lib/auth/require-role";
import { getStaffActor, getStudentSelfActor } from "@/lib/auth/action-actor";
import { notifyReviewAssignment } from "@/lib/notifications/staff-assignment";

function revalidateSubmissionSurfaces() {
  revalidatePath("/ppc", "layout");
  revalidatePath("/admin", "layout");
}

export async function saveDraft(lessonId: number, content: string) {
  const session = await requireAuth();
  const { userId } = getStudentSelfActor(session);
  await upsertDraft(userId, lessonId, content);
  revalidateSubmissionSurfaces();
}

export async function submitWrittenResponse(lessonId: number) {
  const session = await requireAuth();
  const { userId } = getStudentSelfActor(session);
  await submitForReview(userId, lessonId);
  revalidateSubmissionSurfaces();
}

export async function approveWrittenSubmission(submissionId: number) {
  const session = await requireStaff();
  const { reviewerId } = getStaffActor(session);
  const updated = await approveSubmission(submissionId, reviewerId);
  revalidateSubmissionSurfaces();

  if (updated) {
    try {
      const student = await db.query.users.findFirst({ where: (u, { eq: eq2 }) => eq2(u.id, updated.userId) });
      const lesson = await db.query.lessons.findFirst({ where: (l, { eq: eq2 }) => eq2(l.id, updated.lessonId) });
      if (student && lesson) {
        await sendSubmissionReviewed({
          to: student.email,
          studentName: student.name,
          lessonTitle: lesson.title,
          status: "approved",
          lessonUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/ppc/student/level/${lesson.levelId}/lesson/${lesson.id}`,
        });
      }
    } catch { /* email is best-effort */ }
  }
}

export async function requestSubmissionRevision(submissionId: number, note: string) {
  const session = await requireStaff();
  const { reviewerId } = getStaffActor(session);
  const updated = await requestRevision(submissionId, reviewerId, note);
  revalidateSubmissionSurfaces();

  if (updated) {
    try {
      const student = await db.query.users.findFirst({ where: (u, { eq: eq2 }) => eq2(u.id, updated.userId) });
      const lesson = await db.query.lessons.findFirst({ where: (l, { eq: eq2 }) => eq2(l.id, updated.lessonId) });
      if (student && lesson) {
        await sendSubmissionReviewed({
          to: student.email,
          studentName: student.name,
          lessonTitle: lesson.title,
          status: "needs_revision",
          reviewerNote: note,
          lessonUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/ppc/student/level/${lesson.levelId}/lesson/${lesson.id}`,
        });
      }
    } catch { /* email is best-effort */ }
  }
}

export async function updateSubmissionAssignment(
  submissionId: number,
  assignedToId: string | null,
) {
  const session = await requireStaff();
  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    throw new Error("Submission not found");
  }

  const actingUserId = session.user.id;
  const actingRole = session.user.role;

  const previousAssignedToId = submission.assignedTo;
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
      throw new Error("Forbidden: instructors can only assign submissions to themselves");
    }

    if (assignedToId == null && submission.assignedTo !== actingUserId) {
      throw new Error("Forbidden: instructors can only clear their own assignments");
    }
  }

  await setSubmissionAssignment(submissionId, assignedToId);

  if (assignedToId && assignee) {
    const [student, lesson] = await Promise.all([
      db.query.users.findFirst({
        where: (user, { eq }) => eq(user.id, submission.userId),
      }),
      db.query.lessons.findFirst({
        where: (lesson, { eq }) => eq(lesson.id, submission.lessonId),
      }),
    ]);

    if (student && lesson) {
      await notifyReviewAssignment({
        actorId: actingUserId,
        previousAssignedToId,
        nextAssignedToId: assignedToId,
        assignee,
        studentName: student.name,
        lessonTitle: lesson.title,
        lessonNumber: lesson.lessonNumber,
        levelId: lesson.levelId,
      });
    }
  }

  revalidateSubmissionSurfaces();
}
