"use client";

import { useState, useTransition, useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Send, XCircle, MessageSquare, Loader2, Search, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ppc/status-badge";
import { LevelBadge } from "@/components/ppc/level-badge";
import { ThreadView } from "@/components/ppc/thread-view";
import {
  replyToThread,
  closeQaThread,
  reopenQaThread,
  fetchThreadMessages,
  updateQaThreadAssignment,
} from "@/app/ppc/_actions/qa-actions";
import {
  filterQaInbox,
  getQaInboxCounts,
  resolveNextSelectedThreadId,
} from "@/lib/ppc-staff-workflows";

type Thread = {
  id: number;
  userId: string;
  lessonId: number;
  subject: string;
  assignedToId: string | null;
  status: string;
  createdAt: string;
  studentName: string;
  studentEmail: string;
  lessonTitle: string;
  levelId: number;
  lessonNumber: number;
};

type Message = {
  id: number;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: Date | string;
};

type QaInboxClientProps = {
  threads: Thread[];
  currentStaffId: string;
  currentStaffRole: "admin" | "instructor";
  staffOptions: Array<{
    id: string;
    name: string;
    email: string;
  }>;
};

type TabKey = "open" | "answered" | "closed" | "all";
type AssignmentScope = "all" | "mine" | "unassigned";

const tabDefs: { key: TabKey; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "answered", label: "Answered" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];

function parseMessages(
  msgs: Awaited<ReturnType<typeof fetchThreadMessages>>,
): Message[] {
  return msgs.map((m) => ({
    ...m,
    authorName:
      ((m as Record<string, unknown>).authorName as string) ?? "Unknown",
    authorRole:
      ((m as Record<string, unknown>).authorRole as string) ?? "student",
  }));
}

export function QaInboxClient({
  threads,
  currentStaffId,
  currentStaffRole,
  staffOptions,
}: QaInboxClientProps) {
  const router = useRouter();
  const [threadRecords, setThreadRecords] = useState(threads);
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  const [assignmentScope, setAssignmentScope] = useState<AssignmentScope>("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [assignmentValue, setAssignmentValue] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setThreadRecords(threads);
  }, [threads]);

  const counts = useMemo(() => getQaInboxCounts(threadRecords), [threadRecords]);

  const levelOptions = useMemo(
    () =>
      Array.from(new Set(threadRecords.map((thread) => thread.levelId))).sort(
        (left, right) => left - right,
      ),
    [threadRecords],
  );

  const filtered = useMemo(
    () =>
      filterQaInbox(threadRecords, {
        activeTab,
        assignmentScope,
        currentStaffId,
        levelId: levelFilter,
        query: searchQuery,
      }),
    [threadRecords, activeTab, assignmentScope, currentStaffId, levelFilter, searchQuery],
  );

  const selectedThread = threadRecords.find((t) => t.id === selectedId);

  useEffect(() => {
    const nextSelectedId = resolveNextSelectedThreadId(filtered, selectedId);
    if (nextSelectedId !== selectedId) {
      setSelectedId(nextSelectedId);
      setReplyText("");
      setFeedback(null);
    }
  }, [filtered, selectedId]);

  useEffect(() => {
    setAssignmentValue(selectedThread?.assignedToId ?? "");
  }, [selectedThread?.id, selectedThread?.assignedToId]);

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

  const selectThread = useCallback((threadId: number) => {
    setSelectedId(threadId);
    setReplyText("");
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (selectedId == null) {
      setMessages([]);
      setLoadingMessages(false);
      return;
    }

    let isCancelled = false;
    setMessages([]);
    setLoadingMessages(true);

    fetchThreadMessages(selectedId).then((msgs) => {
      if (isCancelled) {
        return;
      }
      setMessages(parseMessages(msgs));
      setLoadingMessages(false);
    });

    return () => {
      isCancelled = true;
    };
  }, [selectedId]);

  const handleReply = () => {
    if (!replyText.trim() || selectedId == null) return;
    startTransition(async () => {
      await replyToThread({
        threadId: selectedId,
        content: replyText.trim(),
      });
      setThreadRecords((prev) =>
        prev.map((thread) =>
          thread.id === selectedId
            ? {
                ...thread,
                assignedToId: currentStaffId,
                status: "answered",
              }
            : thread,
        ),
      );
      setReplyText("");
      setFeedback("Reply sent.");
      const msgs = await fetchThreadMessages(selectedId);
      setMessages(parseMessages(msgs));
      router.refresh();
    });
  };

  const handleClose = () => {
    if (selectedId == null) return;
    startTransition(async () => {
      await closeQaThread(selectedId);
      setThreadRecords((prev) =>
        prev.map((thread) =>
          thread.id === selectedId
            ? {
                ...thread,
                status: "closed",
              }
            : thread,
        ),
      );
      setFeedback("Thread closed.");
      setReplyText("");
      router.refresh();
    });
  };

  const handleReopen = () => {
    if (selectedId == null) return;
    startTransition(async () => {
      await reopenQaThread(selectedId);
      setThreadRecords((prev) =>
        prev.map((thread) =>
          thread.id === selectedId
            ? {
                ...thread,
                status: "open",
              }
            : thread,
        ),
      );
      setFeedback("Thread reopened.");
      router.refresh();
    });
  };

  const handleAssignmentUpdate = (threadId: number, nextAssignedToId: string | null) => {
    startTransition(async () => {
      await updateQaThreadAssignment(threadId, nextAssignedToId);
      setThreadRecords((prev) =>
        prev.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                assignedToId: nextAssignedToId,
              }
            : thread,
        ),
      );
      router.refresh();
    });
  };

  return (
    <div className="grid gap-3">
      <div className="flex gap-1 border-b border-zinc-200">
        {tabDefs.map((tab) => {
          return (
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
          );
        })}
      </div>

      <div className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-3 lg:grid-cols-[minmax(0,1fr)_120px_140px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by subject, student, or lesson"
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

      <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_2fr]">
        <div className="grid content-start gap-2">
          {filtered.length === 0 ? (
            <div className="rounded-sm border border-zinc-200 bg-white px-4 py-8 text-center text-xs text-zinc-400">
              No threads match this inbox view
            </div>
          ) : (
            <>
              <div className="grid gap-2 md:hidden">
                {filtered.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => selectThread(t.id)}
                    className={cn(
                      "rounded-sm border px-3 py-2 text-left transition-colors",
                      selectedId === t.id
                        ? "border-zinc-400 bg-zinc-50"
                        : "border-zinc-200 bg-white hover:bg-zinc-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-zinc-900">
                          {t.subject}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-zinc-400">
                          <span className="truncate">{t.studentName}</span>
                          <LevelBadge level={t.levelId} size="sm" />
                          <span className="truncate">L{t.lessonNumber}</span>
                        </div>
                        <p className="mt-1 text-[10px] text-zinc-400">
                          {getAssigneeLabel(t.assignedToId)}
                        </p>
                      </div>
                      <StatusBadge
                        status={t.status}
                        variant={t.status === "open" ? "warning" : "default"}
                      />
                    </div>
                  </button>
                ))}
              </div>

              <div className="hidden max-h-[600px] overflow-x-auto overflow-y-auto rounded-sm border border-zinc-200 bg-white md:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-zinc-100">
                      <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                        Thread
                      </th>
                      <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                        Student
                      </th>
                      <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                        Status
                      </th>
                      <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                        Assignment
                      </th>
                      <th className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                        Opened
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => selectThread(t.id)}
                        className={cn(
                          "cursor-pointer border-b border-zinc-50 last:border-0 hover:bg-zinc-50",
                          selectedId === t.id && "bg-zinc-50",
                        )}
                      >
                        <td className="px-3 py-2 text-xs font-medium text-zinc-900">
                          {t.subject}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-700">
                              {t.studentName}
                            </span>
                            <LevelBadge level={t.levelId} size="sm" />
                            <span className="text-[11px] text-zinc-400">
                              L{t.lessonNumber}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <StatusBadge
                            status={t.status}
                            variant={t.status === "open" ? "warning" : "default"}
                          />
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-500">
                          {getAssigneeLabel(t.assignedToId)}
                        </td>
                        <td className="px-3 py-2 text-xs text-zinc-500">
                          {t.createdAt
                            ? new Date(t.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "No date"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className="rounded-sm border border-zinc-200 bg-white p-3">
          {selectedThread == null ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare className="size-8 text-zinc-200" />
              <p className="mt-2 text-xs text-zinc-400">
                Select a thread to view
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {selectedThread.subject}
                </p>
                <div className="mt-0.5 flex flex-wrap gap-2 text-[10px] text-zinc-400">
                  <span>{selectedThread.studentName}</span>
                  <span>{selectedThread.studentEmail}</span>
                  <span>
                    {selectedThread.lessonTitle} (L{selectedThread.lessonNumber})
                  </span>
                </div>
              </div>

              <div className="rounded-sm border border-zinc-100 bg-zinc-50 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-zinc-700">
                      Assignment
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      {getAssigneeLabel(selectedThread.assignedToId)}
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
                            selectedThread.id,
                            assignmentValue || null,
                          )
                        }
                        disabled={
                          isPending ||
                          assignmentValue === (selectedThread.assignedToId ?? "")
                        }
                        className="h-8 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
                      >
                        Save assignment
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedThread.assignedToId === currentStaffId ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleAssignmentUpdate(selectedThread.id, null)
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
                            handleAssignmentUpdate(selectedThread.id, currentStaffId)
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

              {feedback ? (
                <div className="rounded-sm border border-zinc-200 bg-zinc-50 px-2.5 py-2 text-[11px] text-zinc-600">
                  {feedback}
                </div>
              ) : null}

              {loadingMessages ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin text-zinc-400" />
                </div>
              ) : (
                <ThreadView messages={messages} />
              )}

              {selectedThread.status !== "closed" ? (
                <div className="grid gap-2">
                  <textarea
                    placeholder="Write a reply…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={3}
                    className="w-full rounded-sm border border-zinc-200 px-3 py-2 text-xs text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReply}
                      disabled={isPending || !replyText.trim()}
                      className="flex h-7 items-center gap-1.5 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                    >
                      <Send className="size-3" />
                      Send reply
                    </button>
                    <button
                      onClick={handleClose}
                      disabled={isPending}
                      className="flex h-7 items-center gap-1.5 rounded-sm border border-zinc-200 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      <XCircle className="size-3" />
                      Close thread
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-2">
                  <p className="text-[11px] text-zinc-500">
                    This thread is closed. Reopen it to continue the conversation.
                  </p>
                  <div>
                    <button
                      onClick={handleReopen}
                      disabled={isPending}
                      className="flex h-7 items-center gap-1.5 rounded-sm border border-zinc-200 px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      <RotateCcw className="size-3" />
                      Reopen thread
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
