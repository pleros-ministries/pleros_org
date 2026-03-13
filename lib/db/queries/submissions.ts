import { eq, and, desc, asc } from "drizzle-orm";
import { db } from "../index";
import { writtenSubmissions, studentProgress, users, lessons } from "../schema";

export async function getSubmission(userId: string, lessonId: number) {
  const [sub] = await db
    .select()
    .from(writtenSubmissions)
    .where(
      and(
        eq(writtenSubmissions.userId, userId),
        eq(writtenSubmissions.lessonId, lessonId),
      ),
    )
    .orderBy(desc(writtenSubmissions.createdAt))
    .limit(1);
  return sub ?? null;
}

export async function getSubmissionById(submissionId: number) {
  const [sub] = await db
    .select({
      submission: writtenSubmissions,
      studentName: users.name,
      studentEmail: users.email,
      lessonNumber: lessons.lessonNumber,
      lessonTitle: lessons.title,
      levelId: lessons.levelId,
    })
    .from(writtenSubmissions)
    .innerJoin(users, eq(writtenSubmissions.userId, users.id))
    .innerJoin(lessons, eq(writtenSubmissions.lessonId, lessons.id))
    .where(eq(writtenSubmissions.id, submissionId));
  return sub ?? null;
}

export async function listPendingSubmissions(levelIds?: number[]) {
  const baseQuery = db
    .select({
      submission: writtenSubmissions,
      studentName: users.name,
      lessonNumber: lessons.lessonNumber,
      lessonTitle: lessons.title,
      levelId: lessons.levelId,
    })
    .from(writtenSubmissions)
    .innerJoin(users, eq(writtenSubmissions.userId, users.id))
    .innerJoin(lessons, eq(writtenSubmissions.lessonId, lessons.id))
    .where(eq(writtenSubmissions.status, "submitted"))
    .orderBy(asc(writtenSubmissions.submittedAt));

  return baseQuery;
}

export async function listSubmissionsByStatus(status: "draft" | "submitted" | "approved" | "needs_revision") {
  return db
    .select({
      submission: writtenSubmissions,
      studentName: users.name,
      studentEmail: users.email,
      lessonNumber: lessons.lessonNumber,
      lessonTitle: lessons.title,
      levelId: lessons.levelId,
    })
    .from(writtenSubmissions)
    .innerJoin(users, eq(writtenSubmissions.userId, users.id))
    .innerJoin(lessons, eq(writtenSubmissions.lessonId, lessons.id))
    .where(eq(writtenSubmissions.status, status))
    .orderBy(desc(writtenSubmissions.submittedAt));
}

export async function saveDraft(userId: string, lessonId: number, content: string) {
  const existing = await getSubmission(userId, lessonId);
  if (existing) {
    const [updated] = await db
      .update(writtenSubmissions)
      .set({ content, status: "draft" })
      .where(eq(writtenSubmissions.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(writtenSubmissions)
    .values({ userId, lessonId, content, status: "draft" })
    .returning();
  return created;
}

export async function submitForReview(userId: string, lessonId: number, content: string) {
  const existing = await getSubmission(userId, lessonId);
  if (existing) {
    const [updated] = await db
      .update(writtenSubmissions)
      .set({ content, status: "submitted", submittedAt: new Date(), reviewerNote: null })
      .where(eq(writtenSubmissions.id, existing.id))
      .returning();
    return updated;
  }
  const [created] = await db
    .insert(writtenSubmissions)
    .values({ userId, lessonId, content, status: "submitted", submittedAt: new Date() })
    .returning();
  return created;
}

export async function approveSubmission(submissionId: number, reviewerId: string) {
  const [updated] = await db
    .update(writtenSubmissions)
    .set({
      status: "approved",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
    })
    .where(eq(writtenSubmissions.id, submissionId))
    .returning();

  if (updated) {
    const [existing] = await db
      .select()
      .from(studentProgress)
      .where(
        and(
          eq(studentProgress.userId, updated.userId),
          eq(studentProgress.lessonId, updated.lessonId),
        ),
      );
    if (existing) {
      await db
        .update(studentProgress)
        .set({ writtenApproved: true })
        .where(eq(studentProgress.id, existing.id));
    } else {
      await db.insert(studentProgress).values({
        userId: updated.userId,
        lessonId: updated.lessonId,
        writtenApproved: true,
      });
    }
  }

  return updated;
}

export async function requestRevision(submissionId: number, reviewerId: string, note: string) {
  const [updated] = await db
    .update(writtenSubmissions)
    .set({
      status: "needs_revision",
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      reviewerNote: note,
    })
    .where(eq(writtenSubmissions.id, submissionId))
    .returning();
  return updated;
}
