"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth/require-role";
import { getStudentSelfActor } from "@/lib/auth/action-actor";

export async function markAudioListened(lessonId: number) {
  const session = await requireAuth();
  const { userId } = getStudentSelfActor(session);
  await db
    .insert(schema.studentProgress)
    .values({ userId, lessonId, audioListened: true })
    .onConflictDoUpdate({
      target: [schema.studentProgress.userId, schema.studentProgress.lessonId],
      set: { audioListened: true },
    });
  revalidatePath("/ppc", "layout");
}

export async function markNotesRead(lessonId: number) {
  const session = await requireAuth();
  const { userId } = getStudentSelfActor(session);
  await db
    .insert(schema.studentProgress)
    .values({ userId, lessonId, notesRead: true })
    .onConflictDoUpdate({
      target: [schema.studentProgress.userId, schema.studentProgress.lessonId],
      set: { notesRead: true },
    });
  revalidatePath("/ppc", "layout");
}
