"use server";

import { revalidatePath } from "next/cache";
import {
  upsertDraft,
  submitForReview,
  approveSubmission,
  requestRevision,
} from "@/lib/db/queries/submissions";

export async function saveDraft(userId: string, lessonId: number, content: string) {
  await upsertDraft(userId, lessonId, content);
  revalidatePath("/ppc", "layout");
}

export async function submitWrittenResponse(userId: string, lessonId: number) {
  await submitForReview(userId, lessonId);
  revalidatePath("/ppc", "layout");
}

export async function approveWrittenSubmission(submissionId: number, reviewerId: string) {
  await approveSubmission(submissionId, reviewerId);
  revalidatePath("/ppc", "layout");
}

export async function requestSubmissionRevision(submissionId: number, reviewerId: string, note: string) {
  await requestRevision(submissionId, reviewerId, note);
  revalidatePath("/ppc", "layout");
}
