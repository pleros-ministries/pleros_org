import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, studentProgress, lessons, levels, levelGraduations } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { sendInactivityReminder } from "@/lib/email/send";
import { isEmailEnabled } from "@/lib/email/resend";

const INACTIVITY_THRESHOLD_DAYS = 2;
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.BETTER_AUTH_URL ?? "";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEmailEnabled()) {
    return NextResponse.json({ skipped: true, reason: "Email not configured" });
  }

  const students = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, "student"));

  let sent = 0;
  const errors: string[] = [];

  for (const student of students) {
    try {
      const latestProgress = await db
        .select({ lessonId: studentProgress.lessonId })
        .from(studentProgress)
        .where(eq(studentProgress.userId, student.id))
        .limit(1);

      if (latestProgress.length === 0) continue;

      const graduations = await db
        .select({ levelId: levelGraduations.levelId })
        .from(levelGraduations)
        .where(eq(levelGraduations.userId, student.id));

      const graduatedIds = graduations.map((g) => g.levelId);
      const currentLevel = graduatedIds.length > 0
        ? Math.min(Math.max(...graduatedIds) + 1, 5)
        : 1;

      const currentLessons = await db
        .select()
        .from(lessons)
        .where(and(eq(lessons.levelId, currentLevel), eq(lessons.status, "published")));

      const progress = await db
        .select()
        .from(studentProgress)
        .where(eq(studentProgress.userId, student.id));

      const nextLesson = currentLessons
        .sort((a, b) => a.lessonNumber - b.lessonNumber)
        .find((l) => {
          const p = progress.find((pr) => pr.lessonId === l.id);
          return !p || !p.audioListened || !p.notesRead || !p.quizPassed || !p.writtenApproved;
        });

      if (!nextLesson) continue;

      const daysSinceActivity = INACTIVITY_THRESHOLD_DAYS;

      await sendInactivityReminder({
        to: student.email,
        studentName: student.name,
        currentLevel,
        currentLesson: `L${currentLevel}.${nextLesson.lessonNumber} ${nextLesson.title}`,
        daysSinceActivity,
        resumeUrl: `${BASE_URL}/ppc/student/level/${currentLevel}/lesson/${nextLesson.id}`,
      });
      sent++;
    } catch (err) {
      errors.push(`${student.email}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return NextResponse.json({ sent, errors: errors.length > 0 ? errors : undefined });
}
