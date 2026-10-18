import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/** `done: false` lets a learner unmark a step they marked by mistake. */
export async function markLessonAudioListened(userId: string, lessonId: number, done = true) {
  await db
    .insert(schema.studentProgress)
    .values({ userId, lessonId, audioListened: done })
    .onConflictDoUpdate({
      target: [schema.studentProgress.userId, schema.studentProgress.lessonId],
      set: { audioListened: done },
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
