import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ArrowRight, BookOpen, GraduationCap, Lock } from "lucide-react";

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
import {
  getCurrentLevelId,
  getDashboardFocus,
  getLevelJourneyRows,
} from "@/lib/student-journey";

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

  const currentLevel = getCurrentLevelId(
    graduations.map((graduation) => graduation.levelId),
    levels.length,
  );

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
  const progressPercent =
    currentLessons.length > 0
      ? Math.round((completedCount / currentLessons.length) * 100)
      : 0;
  const nextLesson = currentProgress.find((p) => !p.completed);
  const dashboardFocus = getDashboardFocus({
    currentLevelId: currentLevel,
    completedLessons: completedCount,
    totalLessons: currentLessons.length,
    nextLesson: nextLesson
      ? {
          id: nextLesson.lesson.id,
          lessonNumber: nextLesson.lesson.lessonNumber,
          title: nextLesson.lesson.title,
        }
      : null,
  });
  const pathwayRows = getLevelJourneyRows(levels, graduatedIds, currentLevel);
  const lessonsRemaining = Math.max(currentLessons.length - completedCount, 0);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="My learning"
        description={`Level ${currentLevel} is active. Use the sidebar to move through your pathway.`}
      />

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-sm border border-zinc-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                {dashboardFocus.eyebrow}
              </p>
              <h3 className="mt-1 text-sm font-semibold text-zinc-900">
                {dashboardFocus.title}
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                {dashboardFocus.description}
              </p>
            </div>
            <LevelBadge level={currentLevel} />
          </div>
          <div className="mt-4 rounded-sm border border-zinc-100 bg-zinc-50 p-3">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Current level progress</span>
              <span className="font-medium text-zinc-900">{progressPercent}%</span>
            </div>
            <ProgressBar value={progressPercent} className="mt-2" size="md" />
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
              <span>{completedCount} completed</span>
              <span className="text-zinc-300">•</span>
              <span>{lessonsRemaining} remaining</span>
              <span className="text-zinc-300">•</span>
              <span>{currentLessons.length} total lessons</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={dashboardFocus.ctaHref}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800"
            >
              {dashboardFocus.ctaLabel}
              <ArrowRight className="size-3.5" />
            </Link>
            <Link
              href={`/ppc/student/level/${currentLevel}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Open current level
            </Link>
          </div>
        </div>

        <div className="rounded-sm border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-900">Progress snapshot</h3>
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

      <section className="rounded-sm border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              Pathway overview
            </h3>
            <p className="mt-1 text-[11px] text-zinc-500">
              The sidebar is your primary navigator. This view shows where each
              level stands.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-2">
          {pathwayRows.map((level) => {
            const icon =
              level.state === "graduated" ? (
                <GraduationCap className="size-3.5 text-emerald-600" />
              ) : level.state === "current" ? (
                <BookOpen className="size-3.5 text-zinc-700" />
              ) : (
                <Lock className="size-3.5 text-zinc-400" />
              );

            const content = (
              <>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-zinc-200 bg-zinc-50">
                    {icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <LevelBadge level={level.id} size="sm" />
                      <span className="text-xs font-medium text-zinc-900">
                        {level.title}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {level.statusLabel}
                    </p>
                  </div>
                </div>
                {level.href ? (
                  <ArrowRight className="size-3.5 text-zinc-300" />
                ) : null}
              </>
            );

            return level.href ? (
              <Link
                key={level.id}
                href={level.href}
                className="flex items-center justify-between gap-3 rounded-sm border border-zinc-200 bg-white px-3 py-2 transition-colors hover:bg-zinc-50"
              >
                {content}
              </Link>
            ) : (
              <div
                key={level.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2"
              >
                {content}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
