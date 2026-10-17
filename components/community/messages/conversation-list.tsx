"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { LockIcon, PenSquareIcon } from "lucide-react";

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
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h1 data-dashboard-page-title className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[21px] font-medium leading-[28px] tracking-[-0.02em] text-[var(--color-community-ink)]">
          Messages
        </h1>
        <button
          type="button"
          onClick={() => setComposing(true)}
          className="inline-flex h-8 items-center gap-1.5 rounded-[10px] bg-[var(--color-community-blue)] px-3 text-[13px] font-semibold text-white"
        >
          <PenSquareIcon className="size-4" strokeWidth={1.9} />
          New message
        </button>
      </div>
    <section className="overflow-hidden rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white">

      {isPending ? (
        <p className="m-0 p-4 text-[13px] leading-[20px] text-[var(--color-community-muted)]">Loading messages…</p>
      ) : isError ? (
        <p className="m-0 p-4 text-[13px] leading-[20px] text-[var(--color-community-muted)]">
          Couldn&apos;t load messages.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="underline underline-offset-2 hover:text-[var(--color-community-ink)]"
          >
            Retry
          </button>
        </p>
      ) : conversations.length === 0 ? (
        <p className="m-0 p-4 text-[13px] leading-[20px] text-[var(--color-community-muted)]">
          No messages yet. Start a conversation with someone in the community.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--color-line,#e7e9ec)]">
          {conversations.map((conversation) => {
            const active = conversation.id === activeId;
            const unread = conversation.unreadCount > 0;
            return (
              <li key={conversation.id}>
                <Link
                  href={`/dashboard/community/messages/${conversation.id}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                    active ? "bg-[var(--color-community-sky-soft)]" : ""
                  }`}
                >
                  <Avatar name={conversation.otherName} size={36} />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13.5px] font-semibold leading-[18px] text-[var(--color-community-ink)]">
                        {conversation.otherName}
                        {conversation.otherUnitName ? (
                          <span className="font-normal text-[var(--color-community-muted)]">
                            {" "}
                            · {conversation.otherUnitName}
                          </span>
                        ) : null}
                      </span>
                      <span className="shrink-0 text-[11.5px] text-[var(--color-community-muted)]">
                        {relativeTime(conversation.lastMessageAt)}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-[12.5px] leading-[17px] ${
                          unread ? "font-medium text-[var(--color-community-ink)]" : "text-[var(--color-community-muted)]"
                        }`}
                      >
                        {conversation.lastMessageMine ? "You: " : ""}
                        {conversation.lastMessagePreview ?? ""}
                      </span>
                      {unread ? (
                        <span
                          aria-label={`${conversation.unreadCount} unread`}
                          className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-community-blue)] px-1.5 text-[11px] font-medium text-white"
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
    <p className="m-0 flex items-center gap-1.5 px-1 text-[12px] leading-[16px] text-[var(--color-community-muted)]">
      <LockIcon className="size-3.5" strokeWidth={1.9} />
      Private by design: only eligible community contacts can be found or messaged.
    </p>
    </div>
  );
}
