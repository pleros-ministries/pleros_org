"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  AlertTriangle,
  RotateCcw,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CompletionSignals } from "@/components/ppc/completion-signals";
import { StatusBadge } from "@/components/ppc/status-badge";
import {
  approveWrittenSubmission,
  requestSubmissionRevision,
} from "@/app/ppc/_actions/submission-actions";
import {
  overrideStudentLevel,
  resetStudentProgress,
} from "@/app/ppc/_actions/student-actions";
import { overrideGraduation } from "@/app/ppc/_actions/graduation-actions";

type StudentDetailClientProps = {
  student: {
    id: string;
    name: string;
    email: string;
    role: string;
    location: string | null;
    createdAt: Date | string;
  };
  levelProgress: Array<{
    levelId: number;
    lessons: Array<{ id: number; title: string; lessonNumber: number }>;
    progress: Array<{
      lessonId: number;
      audioListened: boolean;
      notesRead: boolean;
      quizPassed: boolean;
      writtenApproved: boolean;
    }>;
    graduated: boolean;
  }>;
  submissions: Array<{
    id: number;
    lessonId: number;
    lessonTitle: string;
    levelId: number;
    content: string;
    status: string;
    reviewerNote: string | null;
    submittedAt: string | null;
  }>;
  threads: Array<{
    id: number;
    subject: string;
    status: string;
    lessonTitle: string;
  }>;
  isAdmin: boolean;
  reviewerId: string;
};

export function StudentDetailClient({
  student,
  levelProgress,
  submissions,
  threads,
  isAdmin,
  reviewerId,
}: StudentDetailClientProps) {
  const router = useRouter();
  const [activeLevel, setActiveLevel] = useState(1);
  const [expandedSub, setExpandedSub] = useState<number | null>(null);
  const [revisionNotes, setRevisionNotes] = useState<Record<number, string>>({});
  const [overrideLevel, setOverrideLevel] = useState("1");
  const [isPending, startTransition] = useTransition();
  const [confirmReset, setConfirmReset] = useState(false);

  const currentLP = levelProgress.find((lp) => lp.levelId === activeLevel);
  const levelSubs = submissions.filter((s) => s.levelId === activeLevel);

  const handleApprove = (submissionId: number) => {
    startTransition(async () => {
      await approveWrittenSubmission(submissionId, reviewerId);
      router.refresh();
    });
  };

  const handleRequestRevision = (submissionId: number) => {
    const note = revisionNotes[submissionId]?.trim();
    if (!note) return;
    startTransition(async () => {
      await requestSubmissionRevision(submissionId, reviewerId, note);
      setRevisionNotes((prev) => ({ ...prev, [submissionId]: "" }));
      router.refresh();
    });
  };

  const handleOverrideLevel = () => {
    startTransition(async () => {
      await overrideStudentLevel(student.id, Number(overrideLevel));
      router.refresh();
    });
  };

  const handleResetProgress = () => {
    startTransition(async () => {
      await resetStudentProgress(student.id);
      setConfirmReset(false);
      router.refresh();
    });
  };

  const handleGraduationOverride = () => {
    startTransition(async () => {
      await overrideGraduation(student.id, activeLevel, reviewerId);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-4">
      {/* Student header */}
      <div className="rounded border border-zinc-200 bg-white px-4 py-3">
        <p className="text-sm font-medium text-zinc-900">{student.name}</p>
        <p className="text-xs text-zinc-500">{student.email}</p>
        <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-zinc-400">
          <span>Role: {student.role}</span>
          {student.location && <span>· {student.location}</span>}
          <span>· Joined {new Date(student.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Level tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {[1, 2, 3, 4, 5].map((lvl) => {
          const lp = levelProgress.find((l) => l.levelId === lvl);
          return (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
                activeLevel === lvl
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-400 hover:text-zinc-600",
              )}
            >
              L{lvl}
              {lp?.graduated && (
                <GraduationCap className="size-3 text-emerald-600" />
              )}
            </button>
          );
        })}
      </div>

      {/* Completion matrix */}
      {currentLP && (
        <div className="rounded border border-zinc-200 bg-white p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Lesson progress
          </p>
          <div className="grid gap-2">
            {currentLP.lessons.map((lesson) => {
              const prog = currentLP.progress.find(
                (p) => p.lessonId === lesson.id,
              );
              return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 rounded border border-zinc-100 px-2 py-1.5"
                >
                  <span className="min-w-[20px] text-[10px] text-zinc-400">
                    #{lesson.lessonNumber}
                  </span>
                  <span className="flex-1 text-xs text-zinc-700 truncate">
                    {lesson.title}
                  </span>
                  <CompletionSignals
                    audioListened={prog?.audioListened ?? false}
                    notesRead={prog?.notesRead ?? false}
                    quizPassed={prog?.quizPassed ?? false}
                    writtenApproved={prog?.writtenApproved ?? false}
                    compact
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submissions */}
      {levelSubs.length > 0 && (
        <div className="rounded border border-zinc-200 bg-white p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Written submissions
          </p>
          <div className="grid gap-1">
            {levelSubs.map((sub) => {
              const isExpanded = expandedSub === sub.id;
              const variant =
                sub.status === "approved"
                  ? "success"
                  : sub.status === "needs_revision"
                    ? "warning"
                    : "default";
              return (
                <div key={sub.id} className="border border-zinc-100 rounded">
                  <button
                    onClick={() =>
                      setExpandedSub(isExpanded ? null : sub.id)
                    }
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left"
                  >
                    {isExpanded ? (
                      <ChevronDown className="size-3 text-zinc-400" />
                    ) : (
                      <ChevronRight className="size-3 text-zinc-400" />
                    )}
                    <span className="flex-1 text-xs text-zinc-700 truncate">
                      {sub.lessonTitle}
                    </span>
                    <StatusBadge status={sub.status} variant={variant} />
                  </button>
                  {isExpanded && (
                    <div className="border-t border-zinc-100 px-3 py-2">
                      <p className="whitespace-pre-wrap text-xs text-zinc-600 leading-relaxed">
                        {sub.content}
                      </p>
                      {sub.reviewerNote && (
                        <div className="mt-2 rounded bg-amber-50 px-2 py-1.5 text-[10px] text-amber-700">
                          Reviewer note: {sub.reviewerNote}
                        </div>
                      )}
                      {sub.status === "pending_review" && (
                        <div className="mt-2 flex flex-wrap items-end gap-2">
                          <button
                            onClick={() => handleApprove(sub.id)}
                            disabled={isPending}
                            className="h-7 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {isPending ? "…" : "Approve"}
                          </button>
                          <div className="flex flex-1 items-center gap-1.5 min-w-[200px]">
                            <input
                              type="text"
                              placeholder="Revision note…"
                              value={revisionNotes[sub.id] ?? ""}
                              onChange={(e) =>
                                setRevisionNotes((prev) => ({
                                  ...prev,
                                  [sub.id]: e.target.value,
                                }))
                              }
                              className="h-7 flex-1 rounded-md border border-zinc-200 px-2 text-xs outline-none focus:border-zinc-400"
                            />
                            <button
                              onClick={() => handleRequestRevision(sub.id)}
                              disabled={
                                isPending ||
                                !revisionNotes[sub.id]?.trim()
                              }
                              className="h-7 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                            >
                              Request revision
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Q&A threads */}
      {threads.length > 0 && (
        <div className="rounded border border-zinc-200 bg-white p-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
            Q&A threads
          </p>
          <div className="grid gap-1">
            {threads.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded border border-zinc-100 px-2 py-1.5"
              >
                <span className="flex-1 text-xs text-zinc-700 truncate">
                  {t.subject}
                </span>
                <span className="text-[10px] text-zinc-400 truncate">
                  {t.lessonTitle}
                </span>
                <StatusBadge
                  status={t.status}
                  variant={t.status === "open" ? "warning" : "default"}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin section */}
      {isAdmin && (
        <div className="rounded border border-zinc-200 bg-white p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Shield className="size-3.5 text-zinc-400" />
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              Admin controls
            </p>
          </div>

          <div className="grid gap-3">
            {/* Override level */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-zinc-600">Override level:</span>
              <select
                value={overrideLevel}
                onChange={(e) => setOverrideLevel(e.target.value)}
                className="h-7 rounded-md border border-zinc-200 px-2 text-xs outline-none"
              >
                {[1, 2, 3, 4, 5].map((l) => (
                  <option key={l} value={String(l)}>
                    Level {l}
                  </option>
                ))}
              </select>
              <button
                onClick={handleOverrideLevel}
                disabled={isPending}
                className="h-7 rounded-md bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                Set
              </button>
            </div>

            {/* Reset progress */}
            <div className="flex items-center gap-2">
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="flex h-7 items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-700 hover:bg-red-100"
                >
                  <RotateCcw className="size-3" />
                  Reset progress
                </button>
              ) : (
                <>
                  <span className="flex items-center gap-1 text-xs text-red-600">
                    <AlertTriangle className="size-3" />
                    This is irreversible.
                  </span>
                  <button
                    onClick={handleResetProgress}
                    disabled={isPending}
                    className="h-7 rounded-md bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Confirm reset
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="h-7 rounded-md border border-zinc-200 px-3 text-xs text-zinc-600 hover:bg-zinc-50"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>

            {/* Graduate override */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleGraduationOverride}
                disabled={isPending}
                className="flex h-7 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                <GraduationCap className="size-3" />
                Graduate L{activeLevel} (override)
              </button>
              {currentLP?.graduated && (
                <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                  <CheckCircle2 className="size-3" />
                  Already graduated
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
