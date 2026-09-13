"use server";

import { revalidatePath } from "next/cache";

import { requirePastorOrAdmin } from "@/lib/auth/require-role";
import { hasAdminAccess } from "@/lib/app-role";
import { isPastorAssignedToEnrollment } from "@/lib/db/queries/pastor-followups";
import {
  approveSubmission,
  getSubmissionById,
  requestRevision,
} from "@/lib/db/queries/submissions";
import { getReviewGradingReadiness } from "@/lib/ppc-staff-workflows";
import { db } from "@/lib/db";
import { sendSubmissionReviewed } from "@/lib/email/send";

// Reuses the exact mutation/email functions the instructor Review queue uses
// (lib/db/queries/submissions.ts, lib/email/send.ts) — the only difference
// is authorization: `requireStaff()`/`getStaffActor()` deliberately exclude
// "pastor" (see lib/auth/action-actor.ts), so these actions check ownership
// via `pastor_assignments` instead, scoping a pastor to their own assigned
// enrollee's submissions rather than the platform-wide queue.

async function loadGradableSubmission(input: {
  enrollmentId: number;
  submissionId: number;
}) {
  const submission = await getSubmissionById(input.submissionId);
  if (!submission) {
    return { error: "Submission not found." } as const;
  }

  const enrollment = await db.query.sogpEnrollments.findFirst({
    where: (e, { eq }) => eq(e.id, input.enrollmentId),
  });
  if (!enrollment || enrollment.userId !== submission.userId) {
    return { error: "That response doesn't belong to this enrollee." } as const;
  }

  const lesson = await db.query.lessons.findFirst({
    where: (lesson, { eq }) => eq(lesson.id, submission.lessonId),
  });
  if (!lesson) {
    return { error: "Lesson not found." } as const;
  }

  const readiness = getReviewGradingReadiness({
    status: submission.status,
    content: submission.content,
    responsePrompt: lesson.responsePrompt,
    responseMarkingGuide: lesson.responseMarkingGuide,
  });
  if (!readiness.canGrade) {
    return { error: readiness.detail } as const;
  }

  return { submission, lesson } as const;
}

async function notifyReviewed(
  student: { email: string; name: string } | undefined,
  lesson: { title: string; levelId: number; id: number },
  status: "approved" | "needs_revision",
  reviewerNote?: string,
) {
  if (!student) return;
  try {
    await sendSubmissionReviewed({
      to: student.email,
      studentName: student.name,
      lessonTitle: lesson.title,
      status,
      reviewerNote,
      lessonUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/ppc/student/level/${lesson.levelId}/lesson/${lesson.id}`,
    });
  } catch {
    /* email is best-effort */
  }
}

function revalidateReviewSurfaces(enrollmentId: number) {
  revalidatePath("/admin/my-enrollees");
  revalidatePath(`/admin/my-enrollees/${enrollmentId}`);
}

export async function approvePastorSubmission(input: {
  enrollmentId: number;
  submissionId: number;
}) {
  const session = await requirePastorOrAdmin();

  if (!hasAdminAccess(session.user.role)) {
    const owns = await isPastorAssignedToEnrollment(session.user.id, input.enrollmentId);
    if (!owns) return { error: "Not your enrollee." };
  }

  const loaded = await loadGradableSubmission(input);
  if ("error" in loaded) return { error: loaded.error };
  const { submission, lesson } = loaded;

  const updated = await approveSubmission(submission.id, session.user.id);
  revalidateReviewSurfaces(input.enrollmentId);

  if (updated) {
    const student = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, updated.userId),
    });
    await notifyReviewed(student, lesson, "approved");
  }

  return { error: null as string | null };
}

export async function requestPastorRevision(input: {
  enrollmentId: number;
  submissionId: number;
  note: string;
}) {
  const session = await requirePastorOrAdmin();

  if (!input.note.trim()) {
    return { error: "Write a note explaining what needs revision." };
  }

  if (!hasAdminAccess(session.user.role)) {
    const owns = await isPastorAssignedToEnrollment(session.user.id, input.enrollmentId);
    if (!owns) return { error: "Not your enrollee." };
  }

  const loaded = await loadGradableSubmission(input);
  if ("error" in loaded) return { error: loaded.error };
  const { submission, lesson } = loaded;

  const updated = await requestRevision(submission.id, session.user.id, input.note.trim());
  revalidateReviewSurfaces(input.enrollmentId);

  if (updated) {
    const student = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, updated.userId),
    });
    await notifyReviewed(student, lesson, "needs_revision", input.note.trim());
  }

  return { error: null as string | null };
}
