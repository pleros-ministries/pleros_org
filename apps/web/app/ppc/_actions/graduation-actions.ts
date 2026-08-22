"use server";

import { revalidatePath } from "next/cache";
import { checkGraduationReadiness, graduateStudent } from "@/lib/db/queries/graduations";
import { sendGraduationCongratulations } from "@/lib/email/send";
import { db } from "@/lib/db";
import { getLevels } from "@/lib/db/queries/lessons";
import { requireStaff } from "@/lib/auth/require-role";
import { getStaffActor } from "@/lib/auth/action-actor";

async function notifyGraduation(userId: string, levelId: number) {
  try {
    const student = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
    if (!student) return;
    const allLevels = await getLevels();
    const level = allLevels.find((l) => l.id === levelId);
    const nextLevel = allLevels.find((l) => l.sortOrder === (level?.sortOrder ?? 0) + 1);
    await sendGraduationCongratulations({
      to: student.email,
      studentName: student.name,
      levelTitle: level?.title ?? `Level ${levelId}`,
      nextLevelTitle: nextLevel?.title,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/ppc/student`,
    });
  } catch { /* email is best-effort */ }
}

export async function markGraduation(userId: string, levelId: number) {
  const session = await requireStaff();
  const { reviewerId } = getStaffActor(session);
  const readiness = await checkGraduationReadiness(userId, levelId);
  if (!readiness.ready) {
    return { error: `Not ready: ${readiness.completed}/${readiness.total} lessons completed` };
  }

  const grad = await graduateStudent(userId, levelId, reviewerId);
  revalidatePath("/ppc", "layout");
  await notifyGraduation(userId, levelId);
  return { success: true, graduation: grad };
}

export async function overrideGraduation(userId: string, levelId: number) {
  const session = await requireStaff();
  const { reviewerId } = getStaffActor(session);
  const grad = await graduateStudent(userId, levelId, reviewerId, true);
  revalidatePath("/ppc", "layout");
  await notifyGraduation(userId, levelId);
  return { success: true, graduation: grad };
}
