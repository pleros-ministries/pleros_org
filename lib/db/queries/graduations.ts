import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "../schema";

export async function getGraduations(userId: string) {
  return db.query.levelGraduations.findMany({
    where: (g, { eq: eq2 }) => eq2(g.userId, userId),
  });
}

export async function isLevelGraduated(userId: string, levelId: number) {
  const grad = await db.query.levelGraduations.findFirst({
    where: (g, { eq: eq2, and: and2 }) =>
      and2(eq2(g.userId, userId), eq2(g.levelId, levelId)),
  });
  return !!grad;
}

export async function checkGraduationReadiness(userId: string, levelId: number) {
  const lessons = await db.query.lessons.findMany({
    where: (l, { eq: eq2, and: and2 }) =>
      and2(eq2(l.levelId, levelId), eq2(l.status, "published")),
  });

  const progress = await db
    .select()
    .from(schema.studentProgress)
    .where(eq(schema.studentProgress.userId, userId));

  const completedIds = new Set(
    progress
      .filter((p) => p.audioListened && p.notesRead && p.quizPassed && p.writtenApproved)
      .map((p) => p.lessonId)
  );

  const total = lessons.length;
  const completed = lessons.filter((l) => completedIds.has(l.id)).length;

  return { ready: completed >= total && total > 0, completed, total };
}

export async function graduateStudent(
  userId: string,
  levelId: number,
  graduatedBy: string,
  isOverride = false,
) {
  const [grad] = await db
    .insert(schema.levelGraduations)
    .values({ userId, levelId, graduatedBy, isOverride })
    .onConflictDoUpdate({
      target: [schema.levelGraduations.userId, schema.levelGraduations.levelId],
      set: { graduatedBy, isOverride, graduatedAt: new Date() },
    })
    .returning();
  return grad;
}
