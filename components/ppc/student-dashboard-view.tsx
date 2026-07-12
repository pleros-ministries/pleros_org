import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, Lock } from "lucide-react";

import { LevelBadge } from "@/components/ppc/level-badge";
import { PageHeader } from "@/components/ppc/page-header";
import { ProgressBar } from "@/components/ppc/progress-bar";
import { PushSubscriptionPanel } from "@/components/ppc/push-subscription-panel";

type StudentDashboardFocus = {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
};

type StudentPathwayRow = {
  id: number;
  title: string;
  state: "graduated" | "current" | "locked";
  href: string | null;
  statusLabel: string;
};

type StudentDashboardViewProps = {
  studentName: string;
  currentLevel: number;
  graduatedLevelCount: number;
  completedLessonCount: number;
  totalLessonCount: number;
  progressPercent: number;
  dashboardFocus: StudentDashboardFocus;
  pathwayRows: StudentPathwayRow[];
  isPushConfigured: boolean;
};

export function StudentDashboardView({
  studentName,
  currentLevel,
  graduatedLevelCount,
  completedLessonCount,
  totalLessonCount,
  progressPercent,
  dashboardFocus,
  pathwayRows,
  isPushConfigured,
}: StudentDashboardViewProps) {
  const lessonsRemaining = Math.max(totalLessonCount - completedLessonCount, 0);
  const firstName = studentName.trim().split(/\s+/)[0] || "there";

  return (
    <div className="grid gap-6">
      <div className="grid gap-4">
        <PageHeader title={`Welcome, ${firstName}`} />

        <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-sm border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  {dashboardFocus.eyebrow}
                </p>
                <h3 className="ppc-heading mt-1 text-sm font-semibold text-zinc-900">
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
                <span className="font-medium text-zinc-900">
                  {progressPercent}%
                </span>
              </div>
              <ProgressBar value={progressPercent} className="mt-2" size="md" />
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                <span>{completedLessonCount} completed</span>
                <span className="text-zinc-300">•</span>
                <span>{lessonsRemaining} remaining</span>
                <span className="text-zinc-300">•</span>
                <span>{totalLessonCount} total lessons</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={dashboardFocus.ctaHref}
                className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-medium text-white hover:bg-[var(--color-brand-blue-hover)]"
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

          <div className="grid gap-4">
            <div className="rounded-sm border border-zinc-200 bg-white p-4">
              <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
                Progress snapshot
              </h3>
              <div className="mt-3 grid gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Graduated levels</span>
                  <span className="font-medium text-zinc-900">
                    {graduatedLevelCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Current level</span>
                  <span className="font-medium text-zinc-900">
                    {currentLevel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Lessons completed</span>
                  <span className="font-medium text-zinc-900">
                    {completedLessonCount}/{totalLessonCount}
                  </span>
                </div>
              </div>
            </div>

            <PushSubscriptionPanel
              audience="student"
              isPushConfigured={isPushConfigured}
            />
          </div>
        </section>
      </div>

      <section className="rounded-sm border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="ppc-heading text-sm font-semibold text-zinc-900">
              Pathway overview
            </h3>
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
