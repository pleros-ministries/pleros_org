"use client";

import { useState, useTransition, useCallback, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, ArrowLeft, Send, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ppc/status-badge";
import { ThreadView } from "@/components/ppc/thread-view";
import {
  createQaThread,
  replyToThread,
  fetchThreadMessages,
} from "@/app/ppc/_actions/qa-actions";

type Thread = {
  id: number;
  subject: string;
  status: string;
  createdAt: string;
};

type Message = {
  id: number;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
};

type QaThreadListProps = {
  userId: string;
  lessonId: number;
  userRole: "student" | "instructor" | "admin";
  initialThreads: Thread[];
};

export function QaThreadList({
  userId,
  lessonId,
  userRole,
  initialThreads,
}: QaThreadListProps) {
  const router = useRouter();
  const [threads] = useState(initialThreads);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState("");

  const [isCreating, startCreateTransition] = useTransition();
  const [isLoadingThread, startLoadTransition] = useTransition();
  const [isReplying, startReplyTransition] = useTransition();

  const handleCreateThread = () => {
    if (!newSubject.trim() || !newMessage.trim()) return;
    startCreateTransition(async () => {
      await createQaThread({
        userId,
        lessonId,
        subject: newSubject.trim(),
        message: newMessage.trim(),
        authorRole: userRole,
      });
      setNewSubject("");
      setNewMessage("");
      setShowNewForm(false);
      router.refresh();
    });
  };

  const openThread = useCallback(
    (threadId: number) => {
      setActiveThreadId(threadId);
      startLoadTransition(async () => {
        const msgs = await fetchThreadMessages(threadId);
        setMessages(msgs as Message[]);
      });
    },
    [],
  );

  const handleReply = () => {
    if (!replyText.trim() || activeThreadId === null) return;
    startReplyTransition(async () => {
      await replyToThread({
        threadId: activeThreadId,
        authorId: userId,
        authorRole: userRole,
        content: replyText.trim(),
      });
      setReplyText("");
      const msgs = await fetchThreadMessages(activeThreadId);
      setMessages(msgs as Message[]);
      router.refresh();
    });
  };

  const handleReplyKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleReply();
    }
  };

  if (activeThreadId !== null) {
    const activeThread = threads.find((t) => t.id === activeThreadId);
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => {
            setActiveThreadId(null);
            setMessages([]);
            setReplyText("");
          }}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 transition-colors"
        >
          <ArrowLeft className="size-3" />
          Back to threads
        </button>

        {activeThread && (
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium text-zinc-900">{activeThread.subject}</h3>
            <StatusBadge
              status={activeThread.status}
              variant={activeThread.status === "closed" ? "default" : "success"}
            />
          </div>
        )}

        {isLoadingThread ? (
          <p className="text-xs text-zinc-400">Loading messages…</p>
        ) : (
          <ThreadView messages={messages} currentUserRole={userRole} />
        )}

        <div className="space-y-2">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={handleReplyKeyDown}
            rows={3}
            placeholder="Write a reply… (Cmd+Enter to send)"
            className="w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/50 transition-colors"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReply}
              disabled={isReplying || !replyText.trim()}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-900 px-3 text-xs font-medium text-white transition-colors hover:bg-zinc-800",
                (isReplying || !replyText.trim()) && "opacity-50 cursor-not-allowed",
              )}
            >
              <Send className="size-3.5" />
              {isReplying ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-zinc-900">Questions &amp; answers</h3>
        <button
          type="button"
          onClick={() => setShowNewForm(!showNewForm)}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
        >
          <Plus className="size-3" />
          New question
        </button>
      </div>

      {showNewForm && (
        <div className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/50 transition-colors"
          />
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={3}
            placeholder="Your question…"
            className="w-full resize-y rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400/50 transition-colors"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowNewForm(false);
                setNewSubject("");
                setNewMessage("");
              }}
              className="inline-flex h-7 items-center rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateThread}
              disabled={isCreating || !newSubject.trim() || !newMessage.trim()}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-md bg-zinc-900 px-2 text-xs font-medium text-white transition-colors hover:bg-zinc-800",
                (isCreating || !newSubject.trim() || !newMessage.trim()) &&
                  "opacity-50 cursor-not-allowed",
              )}
            >
              <Send className="size-3" />
              {isCreating ? "Posting…" : "Post question"}
            </button>
          </div>
        </div>
      )}

      {threads.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <MessageSquare className="size-6 text-zinc-300" />
          <p className="text-xs text-zinc-400">No questions yet</p>
        </div>
      ) : (
        <div className="grid gap-1">
          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => openThread(thread.id)}
              className="flex items-center justify-between gap-2 rounded-md border border-zinc-200 bg-white px-3 py-2 text-left hover:bg-zinc-50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900">{thread.subject}</p>
                <p className="text-[10px] text-zinc-400">
                  {new Date(thread.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <StatusBadge
                status={thread.status}
                variant={thread.status === "closed" ? "default" : "success"}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
