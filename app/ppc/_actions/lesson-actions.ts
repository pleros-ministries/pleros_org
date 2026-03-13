"use server";

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { studentProgress } from "@/lib/db/schema";

async function upsertProgress(userId: string, lessonId: number, field: Partial<typeof studentProgress.$inferInsert>) {
  const [existing] = await db
    .select()
    .from(studentProgress)
    .where(
      and(eq(studentProgress.userId, userId), eq(studentProgress.lessonId, lessonId)),
    );

  if (existing) {
    await db
      .update(studentProgress)
      .set(field)
      .where(eq(studentProgress.id, existing.id));
  } else {
    await db.insert(studentProgress).values({ userId, lessonId, ...field });
  }
}

export async function markAudioListened(userId: string, lessonId: number) {
  await upsertProgress(userId, lessonId, { audioListened: true });
  return { success: true };
}

export async function markNotesRead(userId: string, lessonId: number) {
  await upsertProgress(userId, lessonId, { notesRead: true });
  return { success: true };
}
