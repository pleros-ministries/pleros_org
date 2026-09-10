"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import type { ThreadDetail } from "@/lib/db/queries/community-discussion";
import {
  moderateMessage,
  moderateThread,
  reactInThread,
  replyInThread,
  reportContent,
} from "@/app/(site)/dashboard/community/_actions/discussion-actions";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});

export function ThreadView({ thread }: { thread: ThreadDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function act(run: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await run();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed.");
      }
    });
  }

  const topLevel = thread.messages.filter((m) => m.replyToId == null);
  const repliesByParent = new Map<number, typeof thread.messages>();
  for (const message of thread.messages) {
    if (message.replyToId != null) {
      repliesByParent.set(message.replyToId, [
        ...(repliesByParent.get(message.replyToId) ?? []),
        message,
      ]);
    }
  }

  return (
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <nav className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] shadow-sm">
        <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-4">
          <Link
            href="/dashboard/community/discussion"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 hover:text-white"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Discussion
          </Link>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-lime)]">
            Community
          </span>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 pt-5">
        <header className="grid gap-1">
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
            {thread.title}
          </h1>
          <p className="text-xs text-zinc-500">
            Started by {thread.authorName}
            {thread.status === "locked" ? " · locked" : ""}
          </p>
          {thread.canModerate ? (
            <div className="flex gap-3 pt-1 text-xs">
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  act(() =>
                    moderateThread({
                      threadId: thread.id,
                      action: thread.status === "locked" ? "unlock" : "lock",
                    }),
                  )
                }
                className="text-[var(--color-brand-blue)] underline underline-offset-2"
              >
                {thread.status === "locked" ? "Unlock" : "Lock"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  act(async () => {
                    await moderateThread({
                      threadId: thread.id,
                      action: "remove",
                    });
                    router.push("/dashboard/community/discussion");
                  })
                }
                className="text-red-700 underline underline-offset-2"
              >
                Remove thread
              </button>
            </div>
          ) : null}
        </header>

        <ul className="grid gap-3">
          {topLevel.map((message) => (
            <li key={message.id} className="grid gap-2">
              <MessageCard
                threadId={thread.id}
                message={message}
                pending={pending}
                onReact={() =>
                  act(() =>
                    reactInThread({ threadId: thread.id, messageId: message.id }),
                  )
                }
                onReply={() => setReplyTo(message.id)}
                onReport={(reason) =>
                  act(() =>
                    reportContent({
                      targetType: "message",
                      targetId: message.id,
                      reason,
                    }),
                  )
                }
                onModerate={(action) =>
                  act(() => moderateMessage({ messageId: message.id, action }))
                }
              />
              {(repliesByParent.get(message.id) ?? []).map((reply) => (
                <div key={reply.id} className="ml-5">
                  <MessageCard
                    threadId={thread.id}
                    message={reply}
                    pending={pending}
                    onReact={() =>
                      act(() =>
                        reactInThread({
                          threadId: thread.id,
                          messageId: reply.id,
                        }),
                      )
                    }
                    onReport={(reason) =>
                      act(() =>
                        reportContent({
                          targetType: "message",
                          targetId: reply.id,
                          reason,
                        }),
                      )
                    }
                    onModerate={(action) =>
                      act(() =>
                        moderateMessage({ messageId: reply.id, action }),
                      )
                    }
                  />
                </div>
              ))}
            </li>
          ))}
        </ul>

        {thread.status === "open" ? (
          <form
            className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4"
            action={() => {
              if (!body.trim()) return;
              const text = body;
              const parent = replyTo;
              setBody("");
              setReplyTo(null);
              act(() =>
                replyInThread({
                  threadId: thread.id,
                  body: text,
                  replyToId: parent,
                }),
              );
            }}
          >
            {replyTo != null ? (
              <p className="text-xs text-zinc-500">
                Replying to a message ·{" "}
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="underline underline-offset-2"
                >
                  cancel
                </button>
              </p>
            ) : null}
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write a reply…"
              rows={3}
              className="rounded-sm border border-zinc-200 p-2 text-sm"
            />
            {error ? <p className="text-xs text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-8 w-fit items-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Sending…" : "Reply"}
            </button>
          </form>
        ) : (
          <p className="rounded-sm border border-zinc-200 bg-white p-4 text-xs text-zinc-500">
            This discussion is locked.
          </p>
        )}
      </div>
    </section>
  );
}

function MessageCard({
  message,
  pending,
  onReact,
  onReply,
  onReport,
  onModerate,
}: {
  threadId: number;
  message: ThreadDetail["messages"][number];
  pending: boolean;
  onReact: () => void;
  onReply?: () => void;
  onReport: (reason: string) => void;
  onModerate: (action: "hide" | "remove" | "restore") => void;
}) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <div className="grid gap-1.5 rounded-sm border border-zinc-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-zinc-400">
        <span>{message.authorName}</span>
        <span className="font-normal normal-case tracking-normal">
          {dateFmt.format(new Date(message.createdAt))}
        </span>
      </div>
      {message.body == null ? (
        <p className="text-sm italic text-zinc-400">This message was hidden.</p>
      ) : (
        <p className="whitespace-pre-line text-sm leading-[1.6] text-zinc-700">
          {message.body}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
        <button
          type="button"
          disabled={pending}
          onClick={onReact}
          aria-pressed={message.reactedByMe}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
            message.reactedByMe
              ? "border-[var(--color-brand-blue)] text-[var(--color-brand-blue)]"
              : "border-zinc-200 text-zinc-600"
          }`}
        >
          🙏 {message.reactionCount > 0 ? message.reactionCount : ""}
        </button>
        {onReply ? (
          <button
            type="button"
            onClick={onReply}
            className="text-zinc-500 underline underline-offset-2"
          >
            Reply
          </button>
        ) : null}
        {!message.isMine ? (
          <button
            type="button"
            onClick={() => setReporting((value) => !value)}
            className="text-zinc-500 underline underline-offset-2"
          >
            Report
          </button>
        ) : null}
        {message.canModerate && message.body != null ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onModerate("hide")}
            className="text-red-700 underline underline-offset-2"
          >
            Hide
          </button>
        ) : null}
        {message.canModerate && message.body == null ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => onModerate("restore")}
            className="text-[var(--color-brand-blue)] underline underline-offset-2"
          >
            Restore
          </button>
        ) : null}
      </div>
      {reporting ? (
        <div className="flex items-center gap-2 pt-1">
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="What's wrong with this?"
            className="h-7 flex-1 rounded-sm border border-zinc-200 px-2 text-xs"
          />
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              onReport(reason || "Reported");
              setReporting(false);
              setReason("");
            }}
            className="text-xs font-semibold text-red-700"
          >
            Submit
          </button>
        </div>
      ) : null}
    </div>
  );
}
