import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "../schema";

export async function getSubmission(userId: string, lessonId: number) {
  return db.query.writtenSubmissions.findFirst({
    where: (s, { eq: eq2, and: and2 }) =>
      and2(eq2(s.userId, userId), eq2(s.lessonId, lessonId)),
  }) ?? null;
}

export async function upsertDraft(userId: string, lessonId: number, content: string) {
  const existing = await getSubmission(userId, lessonId);

  if (existing) {
    const [updated] = await db
      .update(schema.writtenSubmissions)
      .set({ content })
      .where(eq(schema.writtenSubmissions.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.writtenSubmissions)
    .values({ userId, lessonId, content, status: "draft" })
    .returning();
  return created;
}

export async function submitForReview(userId: string, lessonId: number) {
  const submission = await getSubmission(userId, lessonId);
  if (!submission) throw new Error("No draft found");

  const [updated] = await db
    .update(schema.writtenSubmissions)
    .set({ status: "submitted", submittedAt: new Date() })
    .where(eq(schema.writtenSubmissions.id, submission.id))
    .returning();
  return updated;
}

export async function approveSubmission(submissionId: number, reviewerId: string) {
  const [updated] = await db
    .update(schema.writtenSubmissions)
    .set({
      status: "approved",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(schema.writtenSubmissions.id, submissionId))
    .returning();

  if (updated) {
    await db
      .insert(schema.studentProgress)
      .values({
        userId: updated.userId,
        lessonId: updated.lessonId,
        writtenApproved: true,
      })
      .onConflictDoUpdate({
        target: [schema.studentProgress.userId, schema.studentProgress.lessonId],
        set: { writtenApproved: true },
      });
  }

  return updated;
}

export async function requestRevision(submissionId: number, reviewerId: string, note: string) {
  const [updated] = await db
    .update(schema.writtenSubmissions)
    .set({
      status: "needs_revision",
      reviewedBy: reviewerId,
      reviewerNote: note,
      reviewedAt: new Date(),
    })
    .where(eq(schema.writtenSubmissions.id, submissionId))
    .returning();
  return updated;
}

export async function getPendingSubmissions() {
  return db.query.writtenSubmissions.findMany({
    where: (s, { eq: eq2 }) => eq2(s.status, "submitted"),
    orderBy: (s, { asc }) => [asc(s.submittedAt)],
  });
}

export async function getReviewQueue() {
  const submissions = await db
    .select({
      id: schema.writtenSubmissions.id,
      userId: schema.writtenSubmissions.userId,
      lessonId: schema.writtenSubmissions.lessonId,
      content: schema.writtenSubmissions.content,
      status: schema.writtenSubmissions.status,
      reviewerNote: schema.writtenSubmissions.reviewerNote,
      submittedAt: schema.writtenSubmissions.submittedAt,
      reviewedAt: schema.writtenSubmissions.reviewedAt,
      studentName: schema.users.name,
      studentEmail: schema.users.email,
      lessonTitle: schema.lessons.title,
      lessonNumber: schema.lessons.lessonNumber,
      levelId: schema.lessons.levelId,
    })
    .from(schema.writtenSubmissions)
    .innerJoin(schema.users, eq(schema.writtenSubmissions.userId, schema.users.id))
    .innerJoin(schema.lessons, eq(schema.writtenSubmissions.lessonId, schema.lessons.id))
    .orderBy(desc(schema.writtenSubmissions.submittedAt));

  return submissions;
}
