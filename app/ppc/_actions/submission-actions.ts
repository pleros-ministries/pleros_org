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
import { assertCanAccessPublishedLesson } from "@/lib/auth/student-lesson-access";
import { notifyReviewAssignment } from "@/lib/notifications/staff-assignment";
import { hasAdminAccess, isStaffRole, type AppRole } from "@/lib/app-role";
import { getReviewGradingReadiness } from "@/lib/ppc-staff-workflows";

function revalidateSubmissionSurfaces() {
  revalidatePath("/ppc", "layout");
  revalidatePath("/admin", "layout");
}

async function assertSubmissionCanBeGraded(submissionId: number) {
  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    return { error: "Submission not found", submission: null, lesson: null };
  }

  const lesson = await db.query.lessons.findFirst({
    where: (lesson, { eq }) => eq(lesson.id, submission.lessonId),
  });
  if (!lesson) {
    return { error: "Lesson not found", submission: null, lesson: null };
  }

  const readiness = getReviewGradingReadiness({
    status: submission.status,
    content: submission.content,
    responsePrompt: lesson.responsePrompt,
    responseMarkingGuide: lesson.responseMarkingGuide,
  });

  if (!readiness.canGrade) {
    return { error: readiness.detail, submission: null, lesson: null };
  }

  return { error: null, submission, lesson };
}

export async function saveDraft(lessonId: number, content: string) {
  const session = await requireAuth();
  const { userId } = getStudentSelfActor(session);
  await assertCanAccessPublishedLesson(userId, lessonId);
  await upsertDraft(userId, lessonId, content);
  revalidateSubmissionSurfaces();
}

export async function submitWrittenResponse(lessonId: number) {
  const session = await requireAuth();
  const { userId } = getStudentSelfActor(session);
  await assertCanAccessPublishedLesson(userId, lessonId);
  await submitForReview(userId, lessonId);
  revalidateSubmissionSurfaces();
}

export async function approveWrittenSubmission(submissionId: number) {
  const session = await requireStaff();
  const { reviewerId } = getStaffActor(session);
  const graded = await assertSubmissionCanBeGraded(submissionId);
  if (graded.error) return { error: graded.error };
  const lesson = graded.lesson!;
  const updated = await approveSubmission(submissionId, reviewerId);
  revalidateSubmissionSurfaces();

  if (updated) {
    try {
      const student = await db.query.users.findFirst({ where: (u, { eq: eq2 }) => eq2(u.id, updated.userId) });
      if (student) {
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
  return { error: null as string | null };
}

export async function requestSubmissionRevision(submissionId: number, note: string) {
  const session = await requireStaff();
  const { reviewerId } = getStaffActor(session);
  const graded = await assertSubmissionCanBeGraded(submissionId);
  if (graded.error) return { error: graded.error };
  const lesson = graded.lesson!;
  const updated = await requestRevision(submissionId, reviewerId, note);
  revalidateSubmissionSurfaces();

  if (updated) {
    try {
      const student = await db.query.users.findFirst({ where: (u, { eq: eq2 }) => eq2(u.id, updated.userId) });
      if (student) {
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
  return { error: null as string | null };
}

export async function updateSubmissionAssignment(
  submissionId: number,
  assignedToId: string | null,
) {
  const session = await requireStaff();
  const submission = await getSubmissionById(submissionId);
  if (!submission) {
    return { error: "Submission not found" };
  }

  const actingUserId = session.user.id;
  const actingRole = session.user.role;

  const previousAssignedToId = submission.assignedTo;
  let assignee:
    | {
        id: string;
        name: string;
        email: string;
        role: AppRole;
      }
    | null = null;

  if (assignedToId) {
    assignee =
      (await db.query.users.findFirst({
        where: (user, { eq }) => eq(user.id, assignedToId),
      })) ?? null;

    if (!assignee || !isStaffRole(assignee.role)) {
      return { error: "Assignee must be a staff member" };
    }
  }

  if (!hasAdminAccess(actingRole)) {
    if (assignedToId && assignedToId !== actingUserId) {
      return { error: "Forbidden: instructors can only assign submissions to themselves" };
    }

    if (assignedToId == null && submission.assignedTo !== actingUserId) {
      return { error: "Forbidden: instructors can only clear their own assignments" };
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
  return { error: null as string | null };
}
