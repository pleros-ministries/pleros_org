"use server";

import { updateStudentLevel, resetStudentProgress } from "@/lib/db/queries/students";

export async function overrideStudentLevel(userId: string, level: number) {
  await updateStudentLevel(userId, level);
  return { success: true };
}

export async function resetProgress(userId: string) {
  await resetStudentProgress(userId);
  return { success: true };
}
