"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export async function overrideStudentLevel(userId: string, newLevel: number) {
  const currentGrads = await db
    .select()
    .from(schema.levelGraduations)
    .where(eq(schema.levelGraduations.userId, userId));

  for (let level = 1; level < newLevel; level++) {
    const exists = currentGrads.find((g) => g.levelId === level);
    if (!exists) {
      await db
        .insert(schema.levelGraduations)
        .values({ userId, levelId: level, isOverride: true })
        .onConflictDoNothing();
    }
  }

  revalidatePath("/ppc", "layout");
}

export async function resetStudentProgress(userId: string) {
  await db.delete(schema.studentProgress).where(eq(schema.studentProgress.userId, userId));
  await db.delete(schema.quizAttempts).where(eq(schema.quizAttempts.userId, userId));
  await db.delete(schema.writtenSubmissions).where(eq(schema.writtenSubmissions.userId, userId));
  await db.delete(schema.qaThreads).where(eq(schema.qaThreads.userId, userId));
  await db.delete(schema.levelGraduations).where(eq(schema.levelGraduations.userId, userId));
  revalidatePath("/ppc", "layout");
}

export async function assignReviewer(userId: string, levelId: number) {
  await db
    .insert(schema.reviewerAssignments)
    .values({ userId, levelId })
    .onConflictDoNothing();
  revalidatePath("/ppc", "layout");
}

export async function removeReviewerAssignment(userId: string, levelId: number) {
  await db
    .delete(schema.reviewerAssignments)
    .where(
      and(
        eq(schema.reviewerAssignments.userId, userId),
        eq(schema.reviewerAssignments.levelId, levelId),
      ),
    );
  revalidatePath("/ppc", "layout");
}

export async function getReviewerAssignments() {
  return db
    .select({
      id: schema.reviewerAssignments.id,
      userId: schema.reviewerAssignments.userId,
      levelId: schema.reviewerAssignments.levelId,
      userName: schema.users.name,
      userEmail: schema.users.email,
    })
    .from(schema.reviewerAssignments)
    .innerJoin(schema.users, eq(schema.reviewerAssignments.userId, schema.users.id));
}
