"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";

import type { MessageContact } from "@/lib/db/queries/community-messages";
import { communityKeys } from "@/lib/community/query-keys";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Avatar } from "../avatar";
import { useOpenConversation } from "./use-open-conversation";

type MemberResults = { members: MessageContact[]; canSearch: boolean };

async function fetchMembers(query: string): Promise<MemberResults> {
  const res = await fetch(
    `/api/community/members?q=${encodeURIComponent(query)}`,
    { credentials: "same-origin" },
  );
  if (!res.ok) throw new Error("Failed to search members");
  return (await res.json()) as MemberResults;
}

/** Find someone to message: suggested contacts first, then a first-name search. */
export function NewMessageDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const chat = useOpenConversation();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  // Wait for a pause in typing before searching.
  useEffect(() => {
    const id = setTimeout(() => setQuery(input.trim()), 250);
    return () => clearTimeout(id);
  }, [input]);

  const searching = query.length >= 2;
  const { data, isFetching, isError } = useQuery({
    queryKey: communityKeys.memberSearch(searching ? query : ""),
    queryFn: () => fetchMembers(searching ? query : ""),
    enabled: open,
    staleTime: 60_000,
  });

  const members = data?.members ?? [];
  const canSearch = data?.canSearch ?? true;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setInput("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="site-font-theme">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">New message</DialogTitle>
          <DialogDescription className="text-sm">
            {canSearch
              ? "Search by first name, or pick someone below."
              : "You can message your group leader, your discipler and the Pleros team."}
          </DialogDescription>
        </DialogHeader>

        {canSearch ? (
          <label className="relative block">
            <span className="sr-only">Search members by first name</span>
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400"
              strokeWidth={2}
            />
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="First name"
              autoFocus
              maxLength={40}
              className="h-11 w-full rounded-xl border border-zinc-200 pl-9 pr-3 text-base outline-none focus:border-zinc-300"
            />
          </label>
        ) : null}

        {chat.error ? (
          <p role="alert" className="text-[13px] text-red-700">
            {chat.error}
          </p>
        ) : null}

        <div className="max-h-72 min-h-24 overflow-y-auto">
          {isError ? (
            <p className="py-3 text-sm text-zinc-500">
              Couldn&apos;t load members. Try again.
            </p>
          ) : members.length === 0 ? (
            <p className="py-3 text-sm text-zinc-500">
              {isFetching
                ? "Searching…"
                : searching
                  ? "No one found with that name."
                  : canSearch
                    ? "Type at least two letters to search."
                    : "No contacts available yet."}
            </p>
          ) : (
            <ul className="grid gap-0.5">
              {!searching ? (
                <li className="px-1 pb-1 text-xs font-medium text-zinc-500">
                  Suggested
                </li>
              ) : null}
              {members.map((member) => (
                <li key={member.userId}>
                  <button
                    type="button"
                    disabled={chat.pending}
                    onClick={() => chat.open(member.userId)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-zinc-50 disabled:opacity-60"
                  >
                    <Avatar name={member.firstName} size={36} />
                    <span className="grid min-w-0">
                      <span className="truncate text-sm font-medium text-zinc-900">
                        {member.firstName}
                      </span>
                      <span className="truncate text-xs text-zinc-500">
                        {[member.note, member.unitName]
                          .filter(Boolean)
                          .join(" · ") || "Community member"}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
