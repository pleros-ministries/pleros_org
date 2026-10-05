"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PenSquareIcon } from "lucide-react";

import type { ConversationSummary } from "@/lib/db/queries/community-messages";
import { communityKeys } from "@/lib/community/query-keys";
import { relativeTime } from "@/lib/community/time";

import { Avatar } from "../avatar";
import { NewMessageDialog } from "./new-message-dialog";

type Inbox = { conversations: ConversationSummary[]; unreadTotal: number };

async function fetchInbox(): Promise<Inbox> {
  const res = await fetch("/api/community/messages", {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to load messages");
  return (await res.json()) as Inbox;
}

/** The inbox: every conversation with at least one message, newest first. */
export function ConversationList({ activeId }: { activeId: number | null }) {
  const [composing, setComposing] = useState(false);
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: communityKeys.conversations(),
    queryFn: fetchInbox,
    refetchInterval: 15_000,
  });
  const conversations = data?.conversations ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-(--color-line-strong) bg-white shadow-(--shadow-sm)">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
          Messages
        </h1>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-(--color-brand-blue) px-3.5 text-[13px] font-semibold text-white"
        >
          <PenSquareIcon className="size-4" strokeWidth={2} />
          New message
        </button>
      </div>

      {isPending ? (
        <p className="p-4 text-sm text-zinc-400">Loading messages…</p>
      ) : isError ? (
        <p className="p-4 text-sm text-zinc-500">
          Couldn&apos;t load messages.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="underline underline-offset-2 hover:text-zinc-700"
          >
            Retry
          </button>
        </p>
      ) : conversations.length === 0 ? (
        <p className="p-4 text-sm text-zinc-500">
          No messages yet. Start a conversation with someone in the community.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {conversations.map((conversation) => {
            const active = conversation.id === activeId;
            const unread = conversation.unreadCount > 0;
            return (
              <li key={conversation.id}>
                <Link
                  href={`/dashboard/community/messages/${conversation.id}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    active ? "bg-(--muted)" : "hover:bg-zinc-50"
                  }`}
                >
                  <Avatar name={conversation.otherName} size={40} />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="flex items-baseline justify-between gap-2">
                      <span
                        className={`truncate text-sm text-zinc-900 ${
                          unread ? "font-semibold" : "font-medium"
                        }`}
                      >
                        {conversation.otherName}
                        {conversation.otherUnitName ? (
                          <span className="font-normal text-zinc-400">
                            {" "}
                            · {conversation.otherUnitName}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-xs text-zinc-400">
                        {relativeTime(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-[13px] ${
                          unread ? "font-medium text-zinc-800" : "text-zinc-500"
                        }`}
                      >
                        {conversation.lastMessageMine ? "You: " : ""}
                        {conversation.lastMessagePreview ?? ""}
                      </span>
                      {unread ? (
                        <span
                          aria-label={`${conversation.unreadCount} unread`}
                          className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-(--color-brand-blue) px-1.5 text-[0.7rem] font-semibold text-white"
                        >
                          {conversation.unreadCount > 99
                            ? "99+"
                            : conversation.unreadCount}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <NewMessageDialog open={composing} onOpenChange={setComposing} />
    </section>
  );
}
