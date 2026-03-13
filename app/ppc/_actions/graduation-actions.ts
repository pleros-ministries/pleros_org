"use server";

import { revalidatePath } from "next/cache";
import { checkGraduationReadiness, graduateStudent } from "@/lib/db/queries/graduations";

export async function markGraduation(userId: string, levelId: number, graduatedBy: string) {
  const readiness = await checkGraduationReadiness(userId, levelId);
  if (!readiness.ready) {
    return { error: `Not ready: ${readiness.completed}/${readiness.total} lessons completed` };
  }

  const grad = await graduateStudent(userId, levelId, graduatedBy);
  revalidatePath("/ppc", "layout");
  return { success: true, graduation: grad };
}

export async function overrideGraduation(userId: string, levelId: number, graduatedBy: string) {
  const grad = await graduateStudent(userId, levelId, graduatedBy, true);
  revalidatePath("/ppc", "layout");
  return { success: true, graduation: grad };
}
