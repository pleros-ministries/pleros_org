"use client";

import Link from "next/link";
import { useEffect, useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, RotateCcw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ppc/status-badge";
import { LevelBadge } from "@/components/ppc/level-badge";
import {
  approveWrittenSubmission,
  requestSubmissionRevision,
  updateSubmissionAssignment,
} from "@/app/ppc/_actions/submission-actions";
import {
  filterReviewQueue,
  getReviewQueueCounts,
  resolveNextSelectedSubmissionId,
} from "@/lib/ppc-staff-workflows";

type Submission = {
  id: number;
  userId: string;
  lessonId: number;
  content: string;
  status: string;
  assignedToId: string | null;
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
  currentStaffId: string;
  currentStaffRole: "admin" | "instructor";
  staffOptions: Array<{
    id: string;
    name: string;
    email: string;
  }>;
};

type TabKey = "all" | "pending_review" | "approved" | "needs_revision";
type AssignmentScope = "all" | "mine" | "unassigned";

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending_review", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "needs_revision", label: "Needs revision" },
];

export function ReviewQueueClient({
  submissions,
  currentStaffId,
  currentStaffRole,
  staffOptions,
}: ReviewQueueClientProps) {
  const router = useRouter();
  const [submissionRecords, setSubmissionRecords] = useState(submissions);
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [assignmentScope, setAssignmentScope] = useState<AssignmentScope>("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [revisionNotes, setRevisionNotes] = useState<Record<number, string>>({});
  const [assignmentValue, setAssignmentValue] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSubmissionRecords(submissions);
  }, [submissions]);

  const counts = useMemo(
    () => getReviewQueueCounts(submissionRecords),
    [submissionRecords],
  );

  const levelOptions = useMemo(
    () =>
      Array.from(new Set(submissionRecords.map((submission) => submission.levelId)))
        .sort((left, right) => left - right),
    [submissionRecords],
  );

  const filtered = useMemo(
    () =>
      filterReviewQueue(submissionRecords, {
        activeTab,
        assignmentScope,
        currentStaffId,
        levelId: levelFilter,
        query: searchQuery,
      }),
    [submissionRecords, activeTab, assignmentScope, currentStaffId, levelFilter, searchQuery],
  );
  const selectedSubmission =
    filtered.find((submission) => submission.id === selectedId) ?? null;

  useEffect(() => {
    setSelectedId((current) => resolveNextSelectedSubmissionId(filtered, current));
  }, [filtered]);

  useEffect(() => {
    setAssignmentValue(selectedSubmission?.assignedToId ?? "");
  }, [selectedSubmission?.id, selectedSubmission?.assignedToId]);

  const staffDirectory = useMemo(
    () =>
      new Map(
        staffOptions.map((staff) => [
          staff.id,
          {
            name: staff.id === currentStaffId ? "You" : staff.name,
            email: staff.email,
          },
        ]),
      ),
    [currentStaffId, staffOptions],
  );

  const getAssigneeLabel = (assignedToId: string | null) => {
    if (!assignedToId) {
      return "Unassigned";
    }

    return staffDirectory.get(assignedToId)?.name ?? "Assigned";
  };

  const handleApprove = (id: number) => {
    startTransition(async () => {
      await approveWrittenSubmission(id);
      setSubmissionRecords((prev) =>
        prev.map((submission) =>
          submission.id === id
            ? {
                ...submission,
                assignedToId: currentStaffId,
                status: "approved",
                reviewedAt: new Date().toISOString(),
              }
            : submission,
        ),
      );
      router.refresh();
    });
  };

  const handleRevision = (id: number) => {
    const note = revisionNotes[id]?.trim();
    if (!note) return;
    startTransition(async () => {
      await requestSubmissionRevision(id, note);
      setRevisionNotes((prev) => ({ ...prev, [id]: "" }));
      setSubmissionRecords((prev) =>
        prev.map((submission) =>
          submission.id === id
            ? {
                ...submission,
                assignedToId: currentStaffId,
                status: "needs_revision",
                reviewerNote: note,
                reviewedAt: new Date().toISOString(),
              }
            : submission,
        ),
      );
      router.refresh();
    });
  };

  const handleAssignmentUpdate = (id: number, nextAssignedToId: string | null) => {
    startTransition(async () => {
      await updateSubmissionAssignment(id, nextAssignedToId);
      setSubmissionRecords((prev) =>
        prev.map((submission) =>
          submission.id === id
            ? {
                ...submission,
                assignedToId: nextAssignedToId,
              }
            : submission,
        ),
      );
      router.refresh();
    });
  };

  return (
    <div className="grid gap-3">
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

      <div className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-3 lg:grid-cols-[minmax(0,1fr)_120px_140px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by student, lesson, or response"
            className="h-8 w-full rounded-sm border border-zinc-200 bg-zinc-50 pl-8 pr-2 text-xs outline-none placeholder:text-zinc-300 focus:border-zinc-400"
          />
        </label>
        <select
          value={levelFilter}
          onChange={(event) => setLevelFilter(event.target.value)}
          className="h-8 rounded-sm border border-zinc-200 bg-zinc-50 px-2 text-xs outline-none focus:border-zinc-400"
        >
          <option value="all">All levels</option>
          {levelOptions.map((levelId) => (
            <option key={levelId} value={String(levelId)}>
              Level {levelId}
            </option>
          ))}
        </select>
        <select
          value={assignmentScope}
          onChange={(event) =>
            setAssignmentScope(event.target.value as AssignmentScope)
          }
          className="h-8 rounded-sm border border-zinc-200 bg-zinc-50 px-2 text-xs outline-none focus:border-zinc-400"
        >
          <option value="all">All assignments</option>
          <option value="mine">Mine</option>
          <option value="unassigned">Unassigned</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-sm border border-zinc-200 bg-white px-4 py-8 text-center text-xs text-zinc-400">
          No submissions match this queue view
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-[minmax(320px,1.1fr)_minmax(0,1fr)]">
          <div className="grid gap-2">
            <div className="grid gap-2 md:hidden">
              {filtered.map((sub) => {
                const variant =
                  sub.status === "approved"
                    ? "success"
                    : sub.status === "needs_revision"
                      ? "warning"
                      : "default";

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedId(sub.id)}
                    className={cn(
                      "rounded-sm border px-3 py-2 text-left",
                      selectedId === sub.id
                        ? "border-zinc-400 bg-zinc-50"
                        : "border-zinc-200 bg-white",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-medium text-zinc-900">
                            {sub.studentName}
                          </p>
                          <LevelBadge level={sub.levelId} />
                        </div>
                        <p className="mt-1 truncate text-[11px] text-zinc-500">
                          L{sub.lessonNumber} · {sub.lessonTitle}
                        </p>
                        <p className="mt-2 text-[10px] text-zinc-400">
                          Submitted{" "}
                          {sub.submittedAt
                            ? new Date(sub.submittedAt).toLocaleDateString()
                            : "No date"}
                        </p>
                        <p className="mt-1 text-[10px] text-zinc-400">
                          {getAssigneeLabel(sub.assignedToId)}
                        </p>
                      </div>
                      <StatusBadge status={sub.status} variant={variant} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="hidden overflow-x-auto rounded-sm border border-zinc-200 bg-white md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      Student
                    </th>
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      Lesson
                    </th>
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      Status
                    </th>
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      Assignment
                    </th>
                    <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub) => {
                    const variant =
                      sub.status === "approved"
                        ? "success"
                        : sub.status === "needs_revision"
                          ? "warning"
                          : "default";

                    return (
                      <tr
                        key={sub.id}
                        onClick={() => setSelectedId(sub.id)}
                        className={cn(
                          "cursor-pointer border-b border-zinc-50 last:border-0 hover:bg-zinc-50",
                          selectedId === sub.id && "bg-zinc-50",
                        )}
                      >
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-zinc-900">
                              {sub.studentName}
                            </span>
                            <LevelBadge level={sub.levelId} />
                          </div>
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-600">
                          L{sub.lessonNumber} · {sub.lessonTitle}
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge status={sub.status} variant={variant} />
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-500">
                          {getAssigneeLabel(sub.assignedToId)}
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-500">
                          {sub.submittedAt
                            ? new Date(sub.submittedAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "No date"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-sm border border-zinc-200 bg-white p-3">
            {selectedSubmission == null ? (
              <div className="flex min-h-[220px] items-center justify-center text-center text-xs text-zinc-400">
                Select a submission to review
              </div>
            ) : (
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900">
                        {selectedSubmission.studentName}
                      </p>
                      <LevelBadge level={selectedSubmission.levelId} />
                    </div>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {selectedSubmission.studentEmail} · L{selectedSubmission.lessonNumber}:{" "}
                      {selectedSubmission.lessonTitle}
                    </p>
                  </div>
                  <Link
                    href={`/admin/students/${selectedSubmission.userId}`}
                    className="text-[11px] font-medium text-zinc-500 hover:text-zinc-700"
                  >
                    Open student record
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400">
                  <span>
                    Submitted{" "}
                    {selectedSubmission.submittedAt
                      ? new Date(selectedSubmission.submittedAt).toLocaleDateString()
                      : "No date"}
                  </span>
                  {selectedSubmission.reviewedAt ? (
                    <span>
                      Reviewed {new Date(selectedSubmission.reviewedAt).toLocaleDateString()}
                    </span>
                  ) : null}
                </div>

                <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-medium text-zinc-700">
                        Assignment
                      </p>
                      <p className="text-[11px] text-zinc-500">
                        {getAssigneeLabel(selectedSubmission.assignedToId)}
                      </p>
                    </div>

                    {currentStaffRole === "admin" ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={assignmentValue}
                          onChange={(event) => setAssignmentValue(event.target.value)}
                          className="h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs outline-none focus:border-zinc-400"
                        >
                          <option value="">Unassigned</option>
                          {staffOptions.map((staff) => (
                            <option key={staff.id} value={staff.id}>
                              {staff.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            handleAssignmentUpdate(
                              selectedSubmission.id,
                              assignmentValue || null,
                            )
                          }
                          disabled={
                            isPending ||
                            assignmentValue === (selectedSubmission.assignedToId ?? "")
                          }
                          className="h-8 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                        >
                          Save assignment
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedSubmission.assignedToId === currentStaffId ? (
                          <button
                            type="button"
                            onClick={() =>
                              handleAssignmentUpdate(selectedSubmission.id, null)
                            }
                            disabled={isPending}
                            className="h-8 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                          >
                            Unassign
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleAssignmentUpdate(
                                selectedSubmission.id,
                                currentStaffId,
                              )
                            }
                            disabled={isPending}
                            className="h-8 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                          >
                            Assign to me
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-3">
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-zinc-600">
                    {selectedSubmission.content}
                  </p>
                </div>

                {selectedSubmission.reviewerNote ? (
                  <div className="rounded-sm border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-700">
                    <RotateCcw className="mr-1 inline size-3" />
                    {selectedSubmission.reviewerNote}
                  </div>
                ) : null}

                {selectedSubmission.status === "pending_review" ? (
                  <div className="grid gap-2">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleApprove(selectedSubmission.id)}
                        disabled={isPending}
                        className="flex h-7 items-center gap-1.5 rounded-sm bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <CheckCircle2 className="size-3" />
                        Approve
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                      <input
                        type="text"
                        placeholder="Revision note…"
                        value={revisionNotes[selectedSubmission.id] ?? ""}
                        onChange={(e) =>
                          setRevisionNotes((prev) => ({
                            ...prev,
                            [selectedSubmission.id]: e.target.value,
                          }))
                        }
                        className="h-8 rounded-sm border border-zinc-200 px-2 text-xs outline-none focus:border-zinc-400"
                      />
                      <button
                        onClick={() => handleRevision(selectedSubmission.id)}
                        disabled={
                          isPending ||
                          !revisionNotes[selectedSubmission.id]?.trim()
                        }
                        className="h-8 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                      >
                        Request revision
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
