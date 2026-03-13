import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, CheckCircle2, Clock3, Lock, MessageSquareText } from "lucide-react";
import { eq } from "drizzle-orm";

import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getLevels } from "@/lib/db/queries/lessons";
import { getStudentCurrentLevel, getStudentGraduations, getStudentLevelProgress } from "@/lib/db/queries/students";
import { listThreadsForStudent } from "@/lib/db/queries/qa";
import { PageHeader } from "@/components/ppc/page-header";
import { ProgressBar } from "@/components/ppc/progress-bar";
import { StatCard } from "@/components/ppc/stat-card";
import { resolvePpcHref } from "@/lib/ppc-navigation";

export default async function StudentDashboard() {
  const session = await getAppSession();
  if (!session) redirect("/ppc/sign-in");

  const [dbUser] = await db.select().from(users).where(eq(users.email, session.user.email));
  if (!dbUser) redirect("/ppc/sign-in");

  const allLevels = await getLevels();
  const currentLevel = await getStudentCurrentLevel(dbUser.id);
  const graduations = await getStudentGraduations(dbUser.id);
  const graduatedSet = new Set(graduations.map((g) => g.levelId));
  const levelProgress = await getStudentLevelProgress(dbUser.id, currentLevel);
  const qaThreads = await listThreadsForStudent(dbUser.id);
  const openQa = qaThreads.filter((t) => t.thread.status === "open").length;

  const nextLessonNumber = levelProgress.completedCount + 1;

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Course outline</p>
        {allLevels.map((level) => {
          const isCurrent = level.id === currentLevel;
          const isGraduated = graduatedSet.has(level.id);
          const isLocked = level.id > currentLevel && !isGraduated;

          return (
            <Link
              key={level.id}
              href={isLocked ? "#" : `/ppc/student/level/${level.id}`}
              className={
                isCurrent
                  ? "block rounded border border-zinc-900 bg-zinc-900 px-3 py-2.5 text-white"
                  : isLocked
                    ? "block cursor-not-allowed rounded border border-zinc-100 bg-zinc-50 px-3 py-2.5 text-zinc-400"
                    : "block rounded border border-zinc-200 bg-white px-3 py-2.5 text-zinc-700 hover:border-zinc-300 transition-colors"
              }
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{level.title}</span>
                {isLocked ? (
                  <Lock className="size-3" />
                ) : isGraduated ? (
                  <CheckCircle2 className="size-3" />
                ) : null}
              </div>
              <span className={isCurrent ? "text-[10px] text-zinc-300" : "text-[10px] text-zinc-400"}>
                {level.lessonCount} lessons
                {isCurrent && " · Current"}
                {isGraduated && " · Graduated"}
              </span>
            </Link>
          );
        })}
      </aside>

      <div className="space-y-4">
        <PageHeader
          title={`Continue Level ${currentLevel}`}
          description={`Lesson ${nextLessonNumber} of ${levelProgress.totalLessons}`}
        />

        <div className="rounded border border-zinc-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Level progress</span>
            <span className="font-medium text-zinc-900">{levelProgress.progressPercent}%</span>
          </div>
          <ProgressBar value={levelProgress.progressPercent} size="md" className="mt-2" />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-zinc-500">
              {levelProgress.completedCount} of {levelProgress.totalLessons} lessons complete
            </span>
            <Link
              href={`/ppc/student/level/${currentLevel}`}
              className="inline-flex h-7 items-center rounded-md bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 transition-colors"
            >
              View lessons
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Progress" value={`${levelProgress.progressPercent}%`} icon={BookOpen} hint={`Level ${currentLevel}`} />
          <StatCard
            label="Graduation"
            value={levelProgress.progressPercent === 100 ? "Ready" : "In progress"}
            icon={CheckCircle2}
            hint={levelProgress.progressPercent === 100 ? "Awaiting staff review" : `${levelProgress.totalLessons - levelProgress.completedCount} lessons remaining`}
          />
          <StatCard label="Open Q&A" value={openQa} icon={MessageSquareText} hint="Private threads" />
        </div>
      </div>
    </div>
  );
}
