import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";
import { HelpCircle, PenLine, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import {
  getLevelById,
  getLessonsByLevel,
  getLessonWithProgress,
} from "@/lib/db/queries/lessons";
import { getBestQuizScore } from "@/lib/db/queries/quizzes";
import { getSubmission } from "@/lib/db/queries/submissions";
import { getThreadsByLesson } from "@/lib/db/queries/qa";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { PageHeader } from "@/components/ppc/page-header";
import { AudioPlayer } from "@/components/ppc/audio-player";
import { CompletionSignals } from "@/components/ppc/completion-signals";
import { LessonHubClient } from "@/components/ppc/lesson-hub-client";
import { StatusBadge } from "@/components/ppc/status-badge";

export default async function LessonDetailPage({
  params,
}: {
  params: Promise<{ levelId: string; lessonId: string }>;
}) {
  const { levelId: levelIdStr, lessonId: lessonIdStr } = await params;
  const levelId = Number(levelIdStr);
  const lessonId = Number(lessonIdStr);

  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/sign-in"));
  }

  const userId = session.user.id;
  const level = await getLevelById(levelId);
  if (!level) notFound();

  const result = await getLessonWithProgress(lessonId, userId);
  if (!result) notFound();

  const { lesson, progress } = result;
  if (lesson.levelId !== levelId) notFound();

  const allLessons = await getLessonsByLevel(levelId);
  const currentIdx = allLessons.findIndex((l) => l.id === lessonId);
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null;

  const bestScore = await getBestQuizScore(userId, lessonId);
  const submission = await getSubmission(userId, lessonId);
  const threads = await getThreadsByLesson(lessonId, userId);

  const audioListened = progress?.audioListened ?? false;
  const notesRead = progress?.notesRead ?? false;
  const quizPassed = progress?.quizPassed ?? false;
  const writtenApproved = progress?.writtenApproved ?? false;
  const lessonCompleted =
    audioListened && notesRead && quizPassed && writtenApproved;

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: "My learning", href: "/ppc/student" },
          { label: level.title, href: `/ppc/student/level/${levelId}` },
          { label: `L${levelId}.${lesson.lessonNumber}` },
        ]}
      />

      <PageHeader
        title={lesson.title}
        description={`Level ${levelId} · Lesson ${lesson.lessonNumber}`}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_240px]">
        <div className="rounded-sm border border-zinc-200 bg-white p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                Lesson progress
              </p>
              <p className="mt-1 text-sm font-medium text-zinc-900">
                Stay with this lesson until all four steps are complete.
              </p>
            </div>
            <StatusBadge
              status={lessonCompleted ? "complete" : "in progress"}
              variant={lessonCompleted ? "success" : "warning"}
            />
          </div>
          <div className="mt-3">
            <CompletionSignals
              audioListened={audioListened}
              notesRead={notesRead}
              quizPassed={quizPassed}
              writtenApproved={writtenApproved}
            />
          </div>
        </div>

        <div className="rounded-sm border border-zinc-200 bg-white p-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Level context
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-900">
            Lesson {lesson.lessonNumber} of {allLessons.length}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/ppc/student/level/${levelId}`}
              className="inline-flex h-7 items-center rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back to level
            </Link>
            <Link
              href="/ppc/student"
              className="inline-flex h-7 items-center rounded-sm border border-zinc-200 bg-zinc-50 px-3 text-xs text-zinc-600 hover:bg-zinc-100"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_280px]">
        <div className="space-y-4">
          {lesson.audioUrl && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Audio
              </h3>
              <AudioPlayer src={lesson.audioUrl} title={lesson.title} />
            </section>
          )}

          {lesson.notesContent && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Notes
              </h3>
              <div className="prose prose-sm max-w-none rounded-sm border border-zinc-200 bg-white p-4 text-zinc-700">
                <div dangerouslySetInnerHTML={{ __html: lesson.notesContent }} />
              </div>
            </section>
          )}

          <LessonHubClient
            lessonId={lessonId}
            audioListened={audioListened}
            notesRead={notesRead}
          />

          <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
            {prevLesson ? (
              <Link
                href={`/ppc/student/level/${levelId}/lesson/${prevLesson.id}`}
                className="inline-flex h-7 items-center gap-1 rounded-sm border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                <ChevronLeft className="size-3.5" />
                L{levelId}.{prevLesson.lessonNumber}
              </Link>
            ) : (
              <span />
            )}
            {nextLesson ? (
              <Link
                href={`/ppc/student/level/${levelId}/lesson/${nextLesson.id}`}
                className="inline-flex h-7 items-center gap-1 rounded-sm border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                L{levelId}.{nextLesson.lessonNumber}
                <ChevronRight className="size-3.5" />
              </Link>
            ) : (
              <span />
            )}
          </div>
        </div>

        <aside className="space-y-3">
          <Link
            href={`/ppc/student/level/${levelId}/lesson/${lessonId}/quiz`}
            className="flex items-center gap-3 rounded-sm border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300"
          >
            <HelpCircle className="size-4 shrink-0 text-zinc-400" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-900">Quiz</p>
              <p className="text-[10px] text-zinc-500">
                {quizPassed
                  ? `Passed${bestScore !== null ? ` · ${bestScore}%` : ""}`
                  : bestScore !== null
                    ? `Best: ${bestScore}%`
                    : "Not attempted"}
              </p>
            </div>
            {quizPassed ? <StatusBadge status="ready" variant="success" /> : null}
          </Link>

          <Link
            href={`/ppc/student/level/${levelId}/lesson/${lessonId}/response`}
            className="flex items-center gap-3 rounded-sm border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300"
          >
            <PenLine className="size-4 shrink-0 text-zinc-400" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-900">
                Written response
              </p>
              <p className="text-[10px] text-zinc-500">
                {writtenApproved
                  ? "Approved"
                  : submission
                    ? submission.status.replace(/_/g, " ")
                    : "Not started"}
              </p>
            </div>
            {writtenApproved ? (
              <StatusBadge status="ready" variant="success" />
            ) : null}
          </Link>

          <Link
            href={`/ppc/student/level/${levelId}/lesson/${lessonId}/qa`}
            className="flex items-center gap-3 rounded-sm border border-zinc-200 bg-white p-3 transition-colors hover:border-zinc-300"
          >
            <MessageSquare className="size-4 shrink-0 text-zinc-400" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-900">Q&A</p>
              <p className="text-[10px] text-zinc-500">
                {threads.length > 0
                  ? `${threads.length} thread${threads.length !== 1 ? "s" : ""}`
                  : "No threads"}
              </p>
            </div>
          </Link>

          <div className="rounded-sm border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              After this lesson
            </p>
            <p className="mt-2 text-xs text-zinc-600">
              {nextLesson
                ? `Move on to lesson ${nextLesson.lessonNumber} once this one is complete.`
                : "This is the last lesson in the level. Graduation review follows once everything is complete."}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
