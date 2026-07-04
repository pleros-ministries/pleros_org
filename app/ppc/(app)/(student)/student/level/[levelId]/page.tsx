import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { Lock } from "lucide-react";
import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import {
  getAllLessonsByLevel,
  getLevelById,
  getStudentLevelProgress,
} from "@/lib/db/queries/lessons";
import { isLevelGraduated, checkGraduationReadiness } from "@/lib/db/queries/graduations";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { PageHeader } from "@/components/ppc/page-header";
import { ProgressBar } from "@/components/ppc/progress-bar";
import { CompletionSignals } from "@/components/ppc/completion-signals";
import { StatusBadge } from "@/components/ppc/status-badge";
import { getLessonCompletionState } from "@/lib/student-journey";
import { canStudentAccessLevel } from "@/lib/auth/student-lesson-access";

export default async function LevelDetailPage({
  params,
}: {
  params: Promise<{ levelId: string }>;
}) {
  const { levelId: levelIdStr } = await params;
  const levelId = Number(levelIdStr);

  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/login"));
  }

  const userId = session.user.id;
  const level = await getLevelById(levelId);
  if (!level) notFound();

  if (!(await canStudentAccessLevel(userId, levelId))) {
    redirect("/ppc/student");
  }

  const [graduated, readiness, lessonProgress, allLessons] = await Promise.all([
    isLevelGraduated(userId, levelId),
    checkGraduationReadiness(userId, levelId),
    getStudentLevelProgress(userId, levelId),
    getAllLessonsByLevel(levelId),
  ]);

  const progressByLessonId = new Map(
    lessonProgress.map((item) => [item.lesson.id, item] as const),
  );
  const lockedLessonCount = allLessons.filter(
    (lesson) => lesson.status !== "published",
  ).length;

  const progressPercent =
    readiness.total > 0
      ? Math.round((readiness.completed / readiness.total) * 100)
      : 0;
  const nextLesson = lessonProgress.find(({ completed }) => !completed) ?? null;

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "My learning", href: "/ppc/student" },
          { label: level.title },
        ]}
      />

      <PageHeader
        title={level.title}
        description={level.description ?? undefined}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_240px]">
        <div className="rounded-sm border border-zinc-200 bg-white p-3">
          <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
            <span>Level progress</span>
            <span className="font-medium text-zinc-900">
              {readiness.completed}/{readiness.total}
            </span>
          </div>
          <ProgressBar value={progressPercent} size="md" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={
                nextLesson
                  ? `/ppc/student/level/${levelId}/lesson/${nextLesson.lesson.id}`
                  : `/ppc/student`
              }
              className="inline-flex h-7 items-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-medium text-white hover:bg-[var(--color-brand-blue-hover)]"
            >
              {nextLesson ? "Continue this level" : "Back to dashboard"}
            </Link>
            <span className="inline-flex h-7 items-center rounded-sm border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-500">
              Use the sidebar to switch levels
            </span>
          </div>
        </div>

        <div className="rounded-sm border border-zinc-200 bg-white p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Next step
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-900">
            {nextLesson
              ? `Lesson ${nextLesson.lesson.lessonNumber}`
              : lockedLessonCount > 0
                ? "Locked lessons remain"
              : graduated
                ? "Graduated"
                : "Graduation review"}
          </p>
          <p className="mt-1 text-[11px] text-zinc-500">
            {nextLesson
              ? nextLesson.lesson.title
              : lockedLessonCount > 0
                ? `${lockedLessonCount} lesson${lockedLessonCount === 1 ? "" : "s"} in this level will unlock after content is ready.`
              : graduated
                ? "This level is complete."
                : "All lessons are done. Staff review is the next step."}
          </p>
        </div>
      </div>

      {graduated ? (
        <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          You have graduated from this level.
        </div>
      ) : lockedLessonCount > 0 ? (
        <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          {lockedLessonCount} lesson{lockedLessonCount === 1 ? "" : "s"} in this level are still locked while content is being prepared.
        </div>
      ) : readiness.ready ? (
        <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          All lessons complete. Awaiting staff graduation review.
        </div>
      ) : null}

      <div className="space-y-2">
        {allLessons.map((lesson) => {
          const lessonEntry = progressByLessonId.get(lesson.id);
          const progress = lessonEntry?.progress ?? null;

          if (lesson.status !== "published") {
            return (
              <div
                key={lesson.id}
                className="flex items-center justify-between gap-3 rounded-sm border border-zinc-200 bg-zinc-50 px-3 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-semibold text-zinc-600">
                    {lesson.lessonNumber}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-700">
                      {lesson.title}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      Locked until content is ready
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Lock className="size-3.5 text-zinc-400" />
                  <StatusBadge status="locked" />
                </div>
              </div>
            );
          }

          const completionState = getLessonCompletionState({
            audioListened: progress?.audioListened ?? false,
            notesRead: progress?.notesRead ?? false,
            quizPassed: progress?.quizPassed ?? false,
            writtenApproved: progress?.writtenApproved ?? false,
          });

          return (
            <Link
              key={lesson.id}
              href={`/ppc/student/level/${levelId}/lesson/${lesson.id}`}
              className="flex items-center justify-between gap-3 rounded-sm border border-zinc-200 bg-white px-3 py-2.5 transition-colors hover:border-zinc-300"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">
                  {lesson.lessonNumber}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">
                    {lesson.title}
                  </p>
                  <div className="mt-1">
                    <CompletionSignals
                      audioListened={progress?.audioListened ?? false}
                      notesRead={progress?.notesRead ?? false}
                      quizPassed={progress?.quizPassed ?? false}
                      writtenApproved={progress?.writtenApproved ?? false}
                      compact
                    />
                  </div>
                </div>
              </div>
              <div className="shrink-0">
                <StatusBadge
                  status={completionState.label}
                  variant={completionState.variant}
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
