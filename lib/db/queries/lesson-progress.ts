import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export async function markLessonAudioListened(userId: string, lessonId: number) {
  await db
    .insert(schema.studentProgress)
    .values({ userId, lessonId, audioListened: true })
    .onConflictDoUpdate({
      target: [schema.studentProgress.userId, schema.studentProgress.lessonId],
      set: { audioListened: true },
    });
}

export async function markLessonNotesRead(userId: string, lessonId: number) {
  await db
    .insert(schema.studentProgress)
    .values({ userId, lessonId, notesRead: true })
    .onConflictDoUpdate({
      target: [schema.studentProgress.userId, schema.studentProgress.lessonId],
      set: { notesRead: true },
    });
}
