"use client";

import { Fragment, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, BanIcon, SendIcon } from "lucide-react";

import type {
  ConversationDetail,
  DirectMessage,
} from "@/lib/db/queries/community-messages";
import { DM_BODY_MAX, DM_PAGE_SIZE } from "@/lib/community/messaging";
import { communityKeys } from "@/lib/community/query-keys";
import { clockTime, dayKey, dayLabel } from "@/lib/community/time";
import {
  blockMember,
  markConversationSeen,
  reportMessage,
  sendDirectMessage,
  unblockMember,
} from "@/app/(site)/dashboard/community/_actions/message-actions";

import { ActionMenu, type MenuAction } from "../action-menu";
import { Avatar } from "../avatar";
import { ReportDialog } from "../report-dialog";

async function fetchMessages(
  conversationId: number,
  cursor: { after: number } | { before: number },
): Promise<DirectMessage[]> {
  const param =
    "after" in cursor ? `after=${cursor.after}` : `before=${cursor.before}`;
  const res = await fetch(`/api/community/messages/${conversationId}?${param}`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to load messages");
  const data = (await res.json()) as { messages: DirectMessage[] };
  return data.messages;
}

/** Combines two message lists by id, oldest first. Unsent drafts (negative ids) stay last. */
function mergeMessages(
  current: DirectMessage[],
  incoming: DirectMessage[],
): DirectMessage[] {
  const byId = new Map<number, DirectMessage>();
  for (const message of [...current, ...incoming]) byId.set(message.id, message);
  const all = [...byId.values()];
  const sent = all.filter((m) => m.id > 0).sort((a, b) => a.id - b.id);
  const drafts = all.filter((m) => m.id <= 0).sort((a, b) => b.id - a.id);
  return [...sent, ...drafts];
}

function latestId(messages: DirectMessage[]): number {
  return messages.reduce((max, m) => (m.id > max ? m.id : max), 0);
}

/** One private conversation: history, live updates by polling, and the composer. */
export function MessageThread({
  conversation,
  initialMessages,
  hasEarlier: initialHasEarlier,
}: {
  conversation: ConversationDetail;
  initialMessages: DirectMessage[];
  hasEarlier: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const messagesKey = communityKeys.messages(conversation.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hasEarlier, setHasEarlier] = useState(initialHasEarlier);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [reportId, setReportId] = useState<number | null>(null);
  const [blockPending, startBlockTransition] = useTransition();

  const sendMutation = useMutation({
    mutationFn: async (vars: { body: string; draftId: number }) => {
      const result = await sendDirectMessage({
        conversationId: conversation.id,
        body: vars.body,
      });
      if (!result.ok) throw new Error(result.error);
      return result.message;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: messagesKey });
      queryClient.setQueryData<DirectMessage[]>(messagesKey, (old) => [
        ...(old ?? []),
        {
          id: vars.draftId,
          body: vars.body,
          mine: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    onSuccess: (message, vars) => {
      queryClient.setQueryData<DirectMessage[]>(messagesKey, (old) =>
        mergeMessages(
          (old ?? []).filter((m) => m.id !== vars.draftId),
          [message],
        ),
      );
      queryClient.invalidateQueries({ queryKey: communityKeys.conversations() });
    },
    onError: (e, vars) => {
      queryClient.setQueryData<DirectMessage[]>(messagesKey, (old) =>
        (old ?? []).filter((m) => m.id !== vars.draftId),
      );
      setDraft((current) => current || vars.body);
      setError(
        e instanceof Error ? e.message : "Could not send your message. Try again.",
      );
    },
  });

  // Polling fetches only messages newer than the newest one already shown.
  const { data: messages } = useQuery({
    queryKey: messagesKey,
    queryFn: async () => {
      const current =
        queryClient.getQueryData<DirectMessage[]>(messagesKey) ?? initialMessages;
      const fresh = await fetchMessages(conversation.id, {
        after: latestId(current),
      });
      return mergeMessages(
        queryClient.getQueryData<DirectMessage[]>(messagesKey) ?? current,
        fresh,
      );
    },
    initialData: initialMessages,
    staleTime: 0,
    refetchInterval: sendMutation.isPending ? false : 5_000,
    refetchIntervalInBackground: false,
  });

  const newestId = latestId(messages);
  const newestIncomingId = latestId(messages.filter((m) => !m.mine));

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [newestId, messages.length]);

  // Opening the thread, or receiving a message while it is open, marks it read.
  useEffect(() => {
    if (newestIncomingId === 0) return;
    let cancelled = false;
    markConversationSeen({
      conversationId: conversation.id,
      upToId: newestIncomingId,
    })
      .then(() => {
        if (cancelled) return;
        queryClient.invalidateQueries({
          queryKey: communityKeys.conversations(),
        });
        queryClient.invalidateQueries({
          queryKey: communityKeys.unreadMessages(),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [conversation.id, newestIncomingId, queryClient]);

  function send() {
    const body = draft.trim();
    if (!body || sendMutation.isPending) return;
    setError(null);
    setDraft("");
    sendMutation.mutate({ body, draftId: -Date.now() });
  }

  async function loadEarlier() {
    const first = messages.find((m) => m.id > 0);
    if (!first || loadingEarlier) return;
    setLoadingEarlier(true);
    try {
      const older = await fetchMessages(conversation.id, { before: first.id });
      if (older.length < DM_PAGE_SIZE) setHasEarlier(false);
      queryClient.setQueryData<DirectMessage[]>(messagesKey, (old) =>
        mergeMessages(older, old ?? []),
      );
    } catch {
      setError("Could not load earlier messages. Try again.");
    } finally {
      setLoadingEarlier(false);
    }
  }

  function setBlocked(blocked: boolean) {
    setError(null);
    startBlockTransition(async () => {
      try {
        const result = blocked
          ? await blockMember(conversation.other.userId)
          : await unblockMember(conversation.other.userId);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        router.refresh();
      } catch {
        setError("Could not update that. Try again.");
      }
    });
  }

  const menuActions: MenuAction[] = [
    conversation.blockedByMe
      ? {
          key: "unblock",
          label: `Unblock ${conversation.other.name}`,
          icon: BanIcon,
          onSelect: () => setBlocked(false),
        }
      : {
          key: "block",
          label: `Block ${conversation.other.name}`,
          icon: BanIcon,
          danger: true,
          onSelect: () => {
            if (
              window.confirm(
                `Block ${conversation.other.name}? Neither of you will be able to message the other.`,
              )
            ) {
              setBlocked(true);
            }
          },
        },
  ];

  const nearLimit = draft.length > DM_BODY_MAX - 200;

  return (
    // Fills the viewport below the shell's phone bar (`--dashboard-topbar-offset`),
    // the 50px community bar and the page's 1rem top and 2.5rem bottom padding,
    // so the composer stays on screen; dvh shrinks with the on-screen keyboard.
    <section className="flex h-[calc(100dvh-var(--dashboard-topbar-offset,0px)-6.5rem-2px)] min-h-[20rem] flex-col overflow-hidden rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)">
      <header className="flex items-center gap-3 border-b border-zinc-100 px-3 py-2.5 sm:px-4">
        <Link
          href="/dashboard/community/messages"
          aria-label="Back to messages"
          className="-ml-1 inline-flex size-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 lg:hidden"
        >
          <ArrowLeftIcon className="size-5" strokeWidth={2} />
        </Link>
        <Avatar name={conversation.other.name} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-900">
            {conversation.other.name}
          </p>
          {conversation.other.unitName ? (
            <p className="truncate text-xs text-zinc-500">
              {conversation.other.unitName}
            </p>
          ) : null}
        </div>
        <ActionMenu label="Conversation options" actions={menuActions} />
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-zinc-50/60 px-3 py-4 sm:px-4"
      >
        {hasEarlier ? (
          <div className="mb-3 flex justify-center">
            <button
              type="button"
              onClick={loadEarlier}
              disabled={loadingEarlier}
              className="rounded-full border border-(--color-line-strong) bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-600 disabled:opacity-60"
            >
              {loadingEarlier ? "Loading…" : "Load earlier messages"}
            </button>
          </div>
        ) : null}

        {messages.length === 0 ? (
          <p className="mx-auto max-w-xs py-8 text-center text-[13px] text-zinc-500">
            This is the start of your conversation with{" "}
            {conversation.other.name}. Be kind. You can block or report at any
            time.
          </p>
        ) : (
          <ol className="grid gap-1.5">
            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const newDay =
                !previous || dayKey(previous.createdAt) !== dayKey(message.createdAt);
              const sending = message.id <= 0;
              return (
                <Fragment key={message.id}>
                  {newDay ? (
                    <li className="my-2 text-center text-xs font-medium text-zinc-400">
                      {dayLabel(message.createdAt)}
                    </li>
                  ) : null}
                  <li
                    className={`flex flex-col ${
                      message.mine ? "items-end" : "items-start"
                    }`}
                  >
                    {message.body == null ? (
                      <p className="max-w-[80%] rounded-2xl bg-zinc-100 px-3 py-2 text-sm italic text-zinc-400">
                        This message was removed.
                      </p>
                    ) : (
                      <p
                        className={`max-w-[80%] whitespace-pre-line break-words rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                          message.mine
                            ? "bg-(--color-brand-blue) text-white"
                            : "border border-zinc-200 bg-white text-zinc-800"
                        } ${sending ? "opacity-70" : ""}`}
                      >
                        {message.body}
                      </p>
                    )}
                    <p className="mt-0.5 flex items-center gap-2 px-1 text-[0.7rem] text-zinc-400">
                      {sending ? "Sending…" : clockTime(message.createdAt)}
                      {!message.mine && message.body != null ? (
                        <button
                          type="button"
                          onClick={() => setReportId(message.id)}
                          className="hover:text-zinc-600 hover:underline"
                        >
                          Report
                        </button>
                      ) : null}
                    </p>
                  </li>
                </Fragment>
              );
            })}
          </ol>
        )}
      </div>

      <footer className="border-t border-zinc-100 p-3">
        {error ? (
          <p role="alert" className="mb-2 text-[13px] text-red-700">
            {error}
          </p>
        ) : null}

        {conversation.blockedByMe ? (
          <p className="flex flex-wrap items-center justify-between gap-2 text-[13px] text-zinc-600">
            You blocked {conversation.other.name}.
            <button
              type="button"
              disabled={blockPending}
              onClick={() => setBlocked(false)}
              className="font-medium text-(--color-brand-blue) underline underline-offset-2 disabled:opacity-60"
            >
              Unblock
            </button>
          </p>
        ) : conversation.sendBlockedReason ? (
          <p className="text-[13px] text-zinc-600">
            {conversation.sendBlockedReason}
          </p>
        ) : (
          <form
            className="flex items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              send();
            }}
          >
            <label className="min-w-0 flex-1">
              <span className="sr-only">
                Message {conversation.other.name}
              </span>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  // Enter sends on a keyboard; touch keyboards keep it as a new line.
                  if (
                    event.key === "Enter" &&
                    !event.shiftKey &&
                    !event.nativeEvent.isComposing &&
                    !window.matchMedia("(pointer: coarse)").matches
                  ) {
                    event.preventDefault();
                    send();
                  }
                }}
                placeholder="Write a message…"
                rows={1}
                maxLength={DM_BODY_MAX}
                className="max-h-32 min-h-11 w-full resize-none rounded-2xl border border-zinc-200 bg-white px-3.5 py-2.5 text-base outline-none focus:border-zinc-300"
              />
            </label>
            <button
              type="submit"
              disabled={!draft.trim() || sendMutation.isPending}
              aria-label="Send message"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-(--color-brand-blue) text-white disabled:opacity-40"
            >
              <SendIcon className="size-[18px]" strokeWidth={2} />
            </button>
          </form>
        )}

        {nearLimit ? (
          <p className="mt-1 text-right text-xs text-zinc-400">
            {draft.length}/{DM_BODY_MAX}
          </p>
        ) : null}
      </footer>

      <ReportDialog
        open={reportId != null}
        onOpenChange={(open) => {
          if (!open) setReportId(null);
        }}
        noun="message"
        note="Moderators will see this one message only, not the rest of your conversation."
        onSubmit={(reason) =>
          reportMessage({ messageId: reportId ?? 0, reason })
        }
      />
    </section>
  );
}
