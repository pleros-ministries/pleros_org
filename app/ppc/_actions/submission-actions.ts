"use server";

import { revalidatePath } from "next/cache";
import {
  upsertDraft,
  submitForReview,
  approveSubmission,
  requestRevision,
} from "@/lib/db/queries/submissions";
import { sendSubmissionReviewed } from "@/lib/email/send";
import { db } from "@/lib/db";
import { users, lessons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function saveDraft(userId: string, lessonId: number, content: string) {
  await upsertDraft(userId, lessonId, content);
  revalidatePath("/ppc", "layout");
}

export async function submitWrittenResponse(userId: string, lessonId: number) {
  await submitForReview(userId, lessonId);
  revalidatePath("/ppc", "layout");
}

export async function approveWrittenSubmission(submissionId: number, reviewerId: string) {
  const updated = await approveSubmission(submissionId, reviewerId);
  revalidatePath("/ppc", "layout");

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

export async function requestSubmissionRevision(submissionId: number, reviewerId: string, note: string) {
  const updated = await requestRevision(submissionId, reviewerId, note);
  revalidatePath("/ppc", "layout");

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
