import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { BookOpen, GraduationCap, Lock } from "lucide-react";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getLevels, getLessonsByLevel } from "@/lib/db/queries/lessons";
import { getGraduations } from "@/lib/db/queries/graduations";
import { PageHeader } from "@/components/ppc/page-header";
import { LevelBadge } from "@/components/ppc/level-badge";
import { ProgressBar } from "@/components/ppc/progress-bar";
import { db } from "@/lib/db";
import { studentProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function StudentDashboardPage() {
  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/sign-in"));
  }

  const userId = session.user.id;
  const levels = await getLevels();
  const graduations = await getGraduations(userId);
  const graduatedIds = new Set(graduations.map((g) => g.levelId));

  const currentLevel = graduatedIds.size > 0
    ? Math.min(Math.max(...graduatedIds) + 1, 5)
    : 1;

  const currentLessons = await getLessonsByLevel(currentLevel);
  const progress = await db
    .select()
    .from(studentProgress)
    .where(eq(studentProgress.userId, userId));

  const currentProgress = currentLessons.map((lesson) => {
    const p = progress.find((pr) => pr.lessonId === lesson.id);
    return { lesson, completed: p ? p.audioListened && p.notesRead && p.quizPassed && p.writtenApproved : false };
  });

  const completedCount = currentProgress.filter((p) => p.completed).length;
  const progressPercent = currentLessons.length > 0 ? Math.round((completedCount / currentLessons.length) * 100) : 0;
  const nextLesson = currentProgress.find((p) => !p.completed);

  return (
    <div className="grid gap-6">
      <PageHeader title="My learning" description={`Level ${currentLevel} — ${completedCount}/${currentLessons.length} lessons complete`} />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {levels.map((level) => {
          const graduated = graduatedIds.has(level.id);
          const isCurrent = level.id === currentLevel;
          const locked = level.id > currentLevel;

          return (
            <Link
              key={level.id}
              href={locked ? "#" : `/ppc/student/level/${level.id}`}
              className={`rounded-lg border p-3 transition ${
                isCurrent
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : graduated
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-zinc-200 bg-white opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <LevelBadge level={level.id} size="sm" />
                {graduated && <GraduationCap className="size-3.5 text-emerald-600" />}
                {locked && <Lock className="size-3.5 text-zinc-400" />}
                {isCurrent && <BookOpen className="size-3.5" />}
              </div>
              <p className="mt-2 text-xs font-medium">{level.title}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-900">Level {currentLevel} progress</h3>
            <span className="text-xs text-zinc-500">{progressPercent}%</span>
          </div>
          <ProgressBar value={progressPercent} className="mt-2" size="md" />

          {nextLesson && (
            <Link
              href={`/ppc/student/level/${currentLevel}/lesson/${nextLesson.lesson.id}`}
              className="mt-4 inline-flex h-8 items-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800"
            >
              Continue learning — L{currentLevel}.{nextLesson.lesson.lessonNumber}
            </Link>
          )}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-900">Quick stats</h3>
          <div className="mt-3 grid gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Graduated levels</span>
              <span className="font-medium text-zinc-900">{graduatedIds.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Current level</span>
              <span className="font-medium text-zinc-900">{currentLevel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Lessons completed</span>
              <span className="font-medium text-zinc-900">{completedCount}/{currentLessons.length}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
