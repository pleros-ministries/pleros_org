"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, CheckCircle2, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ppc/status-badge";
import { LevelBadge } from "@/components/ppc/level-badge";
import {
  approveWrittenSubmission,
  requestSubmissionRevision,
} from "@/app/ppc/_actions/submission-actions";

type Submission = {
  id: number;
  userId: string;
  lessonId: number;
  content: string;
  status: string;
  reviewerNote: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  studentName: string;
  studentEmail: string;
  lessonTitle: string;
  lessonNumber: number;
  levelId: number;
};

type ReviewQueueClientProps = {
  submissions: Submission[];
  reviewerId: string;
};

type TabKey = "all" | "pending_review" | "approved" | "needs_revision";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending_review", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "needs_revision", label: "Needs revision" },
];

export function ReviewQueueClient({
  submissions,
  reviewerId,
}: ReviewQueueClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [revisionNotes, setRevisionNotes] = useState<Record<number, string>>({});
  const [isPending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: submissions.length };
    for (const s of submissions) {
      c[s.status] = (c[s.status] ?? 0) + 1;
    }
    return c;
  }, [submissions]);

  const filtered = useMemo(
    () =>
      activeTab === "all"
        ? submissions
        : submissions.filter((s) => s.status === activeTab),
    [submissions, activeTab],
  );

  const handleApprove = (id: number) => {
    startTransition(async () => {
      await approveWrittenSubmission(id, reviewerId);
      router.refresh();
    });
  };

  const handleRevision = (id: number) => {
    const note = revisionNotes[id]?.trim();
    if (!note) return;
    startTransition(async () => {
      await requestSubmissionRevision(id, reviewerId, note);
      setRevisionNotes((prev) => ({ ...prev, [id]: "" }));
      router.refresh();
    });
  };

  return (
    <div className="grid gap-3">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs font-medium transition-colors",
              activeTab === tab.key
                ? "border-zinc-900 text-zinc-900"
                : "border-transparent text-zinc-400 hover:text-zinc-600",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px]",
                activeTab === tab.key
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500",
              )}
            >
              {counts[tab.key] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded border border-zinc-200 bg-white px-4 py-8 text-center text-xs text-zinc-400">
          No submissions in this category
        </div>
      ) : (
        <div className="grid gap-1">
          {filtered.map((sub) => {
            const isExpanded = expandedId === sub.id;
            const variant =
              sub.status === "approved"
                ? "success"
                : sub.status === "needs_revision"
                  ? "warning"
                  : "default";

            return (
              <div
                key={sub.id}
                className="rounded border border-zinc-200 bg-white"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-3 shrink-0 text-zinc-400" />
                  ) : (
                    <ChevronRight className="size-3 shrink-0 text-zinc-400" />
                  )}
                  <div className="flex flex-1 items-center gap-2 overflow-hidden">
                    <span className="text-xs font-medium text-zinc-900 truncate">
                      {sub.studentName}
                    </span>
                    <LevelBadge level={sub.levelId} />
                    <span className="text-xs text-zinc-500 truncate">
                      L{sub.lessonNumber}: {sub.lessonTitle}
                    </span>
                  </div>
                  <StatusBadge status={sub.status} variant={variant} />
                </button>

                {isExpanded && (
                  <div className="border-t border-zinc-100 px-3 py-3">
                    <div className="mb-2 text-[10px] text-zinc-400">
                      {sub.studentEmail}
                      {sub.submittedAt && (
                        <> · Submitted {new Date(sub.submittedAt).toLocaleDateString()}</>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap text-xs text-zinc-600 leading-relaxed">
                      {sub.content}
                    </p>

                    {sub.reviewerNote && (
                      <div className="mt-2 rounded bg-amber-50 px-2 py-1.5 text-[10px] text-amber-700">
                        <RotateCcw className="mr-1 inline size-2.5" />
                        {sub.reviewerNote}
                      </div>
                    )}

                    {sub.status === "pending_review" && (
                      <div className="mt-3 flex flex-wrap items-end gap-2">
                        <button
                          onClick={() => handleApprove(sub.id)}
                          disabled={isPending}
                          className="flex h-7 items-center gap-1.5 rounded-md bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          <CheckCircle2 className="size-3" />
                          Approve
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
                            onClick={() => handleRevision(sub.id)}
                            disabled={
                              isPending || !revisionNotes[sub.id]?.trim()
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
      )}
    </div>
  );
}
