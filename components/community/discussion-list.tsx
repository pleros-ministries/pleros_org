"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { ThreadSummary } from "@/lib/db/queries/community-discussion";
import { startDiscussion } from "@/app/(site)/dashboard/community/_actions/discussion-actions";

import { CommunityTabs } from "./community-tabs";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Africa/Lagos",
});

export function DiscussionList({
  threads,
  unitId,
  unitName,
  showLeaderTab = false,
}: {
  threads: ThreadSummary[];
  unitId: number | null;
  unitName: string | null;
  showLeaderTab?: boolean;
}) {
  return (
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <CommunityTabs
        current="discussion"
        unitId={unitId}
        title="Discussion"
        showLeaderTab={showLeaderTab}
      />

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 pt-4">
        <NewThread unitName={unitName} />

        {threads.length === 0 ? (
          <p className="rounded-sm border border-zinc-200 bg-white p-4 text-xs text-zinc-500">
            No discussions yet. Start one above.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-sm border border-zinc-200 bg-white">
            {threads.map((thread) => (
              <li key={thread.id}>
                <Link
                  href={`/dashboard/community/discussion/${thread.id}`}
                  className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-zinc-50"
                >
                  <span className="flex items-center gap-2 text-sm font-medium text-zinc-900">
                    {thread.title}
                    {thread.status === "locked" ? (
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-amber-700">
                        locked
                      </span>
                    ) : null}
                    {thread.scope === "unit" ? (
                      <span className="text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand-blue)]">
                        unit
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {thread.authorName} · {thread.messageCount} message
                    {thread.messageCount === 1 ? "" : "s"} · last{" "}
                    {dateFmt.format(new Date(thread.lastMessageAt))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function NewThread({ unitName }: { unitName: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"global" | "unit">("global");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-fit items-center rounded-full bg-[var(--color-brand-blue)] px-3 py-1.5 text-xs font-semibold text-white"
      >
        Start a discussion
      </button>
    );
  }

  return (
    <form
      className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4"
      action={() => {
        setError(null);
        startTransition(async () => {
          try {
            const thread = await startDiscussion({ scope, title, body });
            router.push(`/dashboard/community/discussion/${thread.id}`);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not start the discussion.");
          }
        });
      }}
    >
      {unitName ? (
        <div className="flex gap-2 text-xs">
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={scope === "global"}
              onChange={() => setScope("global")}
            />
            Community-wide
          </label>
          <label className="flex items-center gap-1.5">
            <input
              type="radio"
              checked={scope === "unit"}
              onChange={() => setScope("unit")}
            />
            {unitName}
          </label>
        </div>
      ) : null}
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Discussion title"
        className="h-9 rounded-sm border border-zinc-200 px-2 text-sm"
      />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Say what's on your mind…"
        rows={3}
        className="rounded-sm border border-zinc-200 p-2 text-sm"
      />
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-8 items-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Starting…" : "Start"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 underline underline-offset-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
