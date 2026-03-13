"use server";

import { graduateStudent } from "@/lib/db/queries/graduations";

export async function markGraduation(userId: string, levelId: number, graduatedBy: string) {
  const result = await graduateStudent(userId, levelId, graduatedBy);
  return { success: true, graduation: result };
}

export async function overrideGraduation(userId: string, levelId: number, graduatedBy: string) {
  const result = await graduateStudent(userId, levelId, graduatedBy, true);
  return { success: true, graduation: result };
}
