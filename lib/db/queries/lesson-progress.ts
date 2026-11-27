import { sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * `done: false` lets a learner unmark a step they marked by mistake. The first
 * time a teaching is marked listened is kept, so the monthly calendar can place
 * it on its day; unmarking clears it.
 */
export async function markLessonAudioListened(userId: string, lessonId: number, done = true) {
  await db
    .insert(schema.studentProgress)
    .values({ userId, lessonId, audioListened: done, audioListenedAt: done ? new Date() : null })
    .onConflictDoUpdate({
      target: [schema.studentProgress.userId, schema.studentProgress.lessonId],
      set: { audioListened: done, audioListenedAt: done ? sql`coalesce(${schema.studentProgress.audioListenedAt}, now())` : null },
    });
}

export async function markLessonNotesRead(userId: string, lessonId: number, done = true) {
  await db
    .insert(schema.studentProgress)
    .values({ userId, lessonId, notesRead: done })
    .onConflictDoUpdate({
      target: [schema.studentProgress.userId, schema.studentProgress.lessonId],
      set: { notesRead: done },
    });
}
