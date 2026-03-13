import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getLevelById, getStudentLevelProgress } from "@/lib/db/queries/lessons";
import { isLevelGraduated, checkGraduationReadiness } from "@/lib/db/queries/graduations";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { PageHeader } from "@/components/ppc/page-header";
import { ProgressBar } from "@/components/ppc/progress-bar";
import { CompletionSignals } from "@/components/ppc/completion-signals";
import { StatusBadge } from "@/components/ppc/status-badge";

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
    redirect(toExternalPpcPath(h.get("host"), "/sign-in"));
  }

  const userId = session.user.id;
  const level = await getLevelById(levelId);
  if (!level) notFound();

  const graduated = await isLevelGraduated(userId, levelId);
  const readiness = await checkGraduationReadiness(userId, levelId);
  const lessonProgress = await getStudentLevelProgress(userId, levelId);

  const progressPercent =
    readiness.total > 0
      ? Math.round((readiness.completed / readiness.total) * 100)
      : 0;

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

      <div className="rounded border border-zinc-200 bg-white p-3">
        <div className="mb-1.5 flex items-center justify-between text-xs text-zinc-500">
          <span>Level progress</span>
          <span className="font-medium text-zinc-900">
            {readiness.completed}/{readiness.total}
          </span>
        </div>
        <ProgressBar value={progressPercent} size="md" />
      </div>

      {graduated ? (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          You have graduated from this level.
        </div>
      ) : readiness.ready ? (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          All lessons complete. Awaiting staff graduation review.
        </div>
      ) : null}

      <div className="space-y-2">
        {lessonProgress.map(({ lesson, progress, completed }) => (
          <Link
            key={lesson.id}
            href={`/ppc/student/level/${levelId}/lesson/${lesson.id}`}
            className="flex items-center justify-between gap-3 rounded border border-zinc-200 bg-white px-3 py-2.5 transition-colors hover:border-zinc-300"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">
                {lesson.lessonNumber}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-900">
                  {lesson.title}
                </p>
                {progress && (
                  <div className="mt-1">
                    <CompletionSignals
                      audioListened={progress.audioListened}
                      notesRead={progress.notesRead}
                      quizPassed={progress.quizPassed}
                      writtenApproved={progress.writtenApproved}
                      compact
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="shrink-0">
              {completed ? (
                <StatusBadge status="complete" variant="success" />
              ) : progress ? (
                <StatusBadge status="in progress" variant="warning" />
              ) : (
                <StatusBadge status="not started" />
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
