"use server";

import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export async function markAudioListened(userId: string, lessonId: number) {
  await db
    .insert(schema.studentProgress)
    .values({ userId, lessonId, audioListened: true })
    .onConflictDoUpdate({
      target: [schema.studentProgress.userId, schema.studentProgress.lessonId],
      set: { audioListened: true },
    });
  revalidatePath("/ppc", "layout");
}

export async function markNotesRead(userId: string, lessonId: number) {
  await db
    .insert(schema.studentProgress)
    .values({ userId, lessonId, notesRead: true })
    .onConflictDoUpdate({
      target: [schema.studentProgress.userId, schema.studentProgress.lessonId],
      set: { notesRead: true },
    });
  revalidatePath("/ppc", "layout");
}
