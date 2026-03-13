import { redirect } from "next/navigation";
import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { CheckCircle2, Circle, Lock } from "lucide-react";

import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import { users, studentProgress, lessons as lessonsTable } from "@/lib/db/schema";
import { getLevelById, getPublishedLessonsByLevel } from "@/lib/db/queries/lessons";
import { getStudentCurrentLevel, getStudentGraduations } from "@/lib/db/queries/students";
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
  if (!session) redirect("/ppc/sign-in");

  const [dbUser] = await db.select().from(users).where(eq(users.email, session.user.email));
  if (!dbUser) redirect("/ppc/sign-in");

  const level = await getLevelById(levelId);
  if (!level) redirect("/ppc/student");

  const lessons = await getPublishedLessonsByLevel(levelId);
  const graduated = await isLevelGraduated(dbUser.id, levelId);
  const readiness = await checkGraduationReadiness(dbUser.id, levelId);

  const progressRows = await db
    .select()
    .from(studentProgress)
    .innerJoin(lessonsTable, eq(studentProgress.lessonId, lessonsTable.id))
    .where(
      and(eq(studentProgress.userId, dbUser.id), eq(lessonsTable.levelId, levelId)),
    );

  const progressMap = new Map(
    progressRows.map((r) => [r.lessons.id, r.student_progress]),
  );

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "My Learning", href: "/ppc/student" },
          { label: level.title },
        ]}
      />

      <PageHeader title={level.title} description={level.description ?? undefined} />

      <div className="rounded border border-zinc-200 bg-white p-3">
        <div className="flex items-center justify-between text-xs text-zinc-500 mb-1.5">
          <span>Level progress</span>
          <span className="font-medium text-zinc-900">{readiness.completedCount}/{readiness.totalCount}</span>
        </div>
        <ProgressBar value={readiness.completedCount} max={readiness.totalCount || 1} size="md" />
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
        {lessons.map((lesson) => {
          const prog = progressMap.get(lesson.id);
          const isComplete =
            prog?.audioListened && prog?.notesRead && prog?.quizPassed && prog?.writtenApproved;

          return (
            <Link
              key={lesson.id}
              href={`/ppc/student/level/${levelId}/lesson/${lesson.id}`}
              className="flex items-center justify-between gap-3 rounded border border-zinc-200 bg-white px-3 py-2.5 hover:border-zinc-300 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-600">
                  {lesson.lessonNumber}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{lesson.title}</p>
                  {prog && (
                    <div className="mt-1">
                      <CompletionSignals
                        audioListened={prog.audioListened}
                        notesRead={prog.notesRead}
                        quizPassed={prog.quizPassed}
                        writtenApproved={prog.writtenApproved}
                        compact
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {isComplete ? (
                  <StatusBadge status="complete" variant="success" />
                ) : prog ? (
                  <StatusBadge status="in progress" variant="warning" />
                ) : (
                  <StatusBadge status="not started" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
