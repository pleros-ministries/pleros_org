"use server";

import {
  saveDraft as saveDraftQuery,
  submitForReview as submitForReviewQuery,
  approveSubmission as approveSubmissionQuery,
  requestRevision as requestRevisionQuery,
} from "@/lib/db/queries/submissions";

export async function saveDraft(userId: string, lessonId: number, content: string) {
  const sub = await saveDraftQuery(userId, lessonId, content);
  return { success: true, submission: sub };
}

export async function submitWrittenResponse(userId: string, lessonId: number, content: string) {
  const sub = await submitForReviewQuery(userId, lessonId, content);
  return { success: true, submission: sub };
}

export async function approveSubmission(submissionId: number, reviewerId: string) {
  const sub = await approveSubmissionQuery(submissionId, reviewerId);
  return { success: true, submission: sub };
}

export async function requestRevision(submissionId: number, reviewerId: string, note: string) {
  const sub = await requestRevisionQuery(submissionId, reviewerId, note);
  return { success: true, submission: sub };
}
