"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, XCircle, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ppc/status-badge";
import { LevelBadge } from "@/components/ppc/level-badge";
import { ThreadView } from "@/components/ppc/thread-view";
import {
  replyToThread,
  closeQaThread,
  fetchThreadMessages,
} from "@/app/ppc/_actions/qa-actions";

type Thread = {
  id: number;
  userId: string;
  lessonId: number;
  subject: string;
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
  reviewerId: string;
  reviewerRole: "admin" | "instructor";
};

type TabKey = "open" | "answered" | "all";

const tabDefs: { key: TabKey; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "answered", label: "Answered" },
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
  reviewerId,
  reviewerRole,
}: QaInboxClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("open");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered =
    activeTab === "all"
      ? threads
      : threads.filter((t) =>
          activeTab === "open"
            ? t.status === "open"
            : t.status === "answered" || t.status === "closed",
        );

  const selectedThread = threads.find((t) => t.id === selectedId);

  const selectThread = useCallback((threadId: number) => {
    setSelectedId(threadId);
    setMessages([]);
    setLoadingMessages(true);
    fetchThreadMessages(threadId).then((msgs) => {
      setMessages(parseMessages(msgs));
      setLoadingMessages(false);
    });
  }, []);

  const handleReply = () => {
    if (!replyText.trim() || selectedId == null) return;
    startTransition(async () => {
      await replyToThread({
        threadId: selectedId,
        authorId: reviewerId,
        authorRole: reviewerRole,
        content: replyText.trim(),
      });
      setReplyText("");
      const msgs = await fetchThreadMessages(selectedId);
      setMessages(parseMessages(msgs));
      router.refresh();
    });
  };

  const handleClose = () => {
    if (selectedId == null) return;
    startTransition(async () => {
      await closeQaThread(selectedId);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-3">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-200">
        {tabDefs.map((tab) => {
          const count =
            tab.key === "all"
              ? threads.length
              : threads.filter((t) =>
                  tab.key === "open"
                    ? t.status === "open"
                    : t.status === "answered" || t.status === "closed",
                ).length;
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
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Split layout */}
      <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_2fr]">
        {/* Thread list */}
        <div className="grid content-start gap-1 max-h-[600px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="rounded-sm border border-zinc-200 bg-white px-4 py-8 text-center text-xs text-zinc-400">
              No threads
            </div>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => selectThread(t.id)}
                className={cn(
                  "flex flex-col gap-1 rounded-sm border px-3 py-2 text-left transition-colors",
                  selectedId === t.id
                    ? "border-zinc-400 bg-zinc-50"
                    : "border-zinc-200 bg-white hover:bg-zinc-50",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-xs font-medium text-zinc-900 truncate">
                    {t.subject}
                  </span>
                  <StatusBadge
                    status={t.status}
                    variant={t.status === "open" ? "warning" : "default"}
                  />
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                  <span className="truncate">{t.studentName}</span>
                  <LevelBadge level={t.levelId} size="sm" />
                  <span className="truncate">L{t.lessonNumber}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
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

              {loadingMessages ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="size-4 animate-spin text-zinc-400" />
                </div>
              ) : (
                <ThreadView messages={messages} />
              )}

              {selectedThread.status === "open" && (
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
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
