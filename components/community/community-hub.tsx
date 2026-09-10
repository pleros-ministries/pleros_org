"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SendIcon } from "lucide-react";

import type { FeedPost } from "@/lib/db/queries/community-posts";
import { createLeaderUnitPost } from "@/app/(site)/dashboard/community/_actions/community-learner-actions";

import { CommunityTabs } from "./community-tabs";
import { PostList } from "./post-list";

type HubUnit = { id: number; name: string; telegramUrl: string | null } | null;

export function CommunityHub({
  initialFeed,
  unit,
  isUnitLeader,
  isAdmin,
}: {
  initialFeed: FeedPost[];
  unit: HubUnit;
  isUnitLeader: boolean;
  isAdmin: boolean;
}) {
  return (
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <CommunityTabs
        current="feed"
        unitId={unit?.id ?? null}
        title={unit ? unit.name : "Community"}
      />

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 pt-4">
        {unit && (isUnitLeader || isAdmin) ? <LeaderComposer /> : null}

        <PostList
          posts={initialFeed}
          emptyText="No posts yet. Official updates and your unit's posts will show here."
        />
      </div>
    </section>
  );
}

function LeaderComposer() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--color-brand-blue)] px-3 py-1.5 text-xs font-semibold text-white"
      >
        <SendIcon className="size-3.5" strokeWidth={2} /> Post to your unit
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
            await createLeaderUnitPost({ title, body });
            setTitle("");
            setBody("");
            setOpen(false);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Could not post.");
          }
        });
      }}
    >
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Title (optional)"
        className="h-9 rounded-sm border border-zinc-200 px-2 text-sm"
      />
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Share an update with your unit…"
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
          {pending ? "Posting…" : "Post"}
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
