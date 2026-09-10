"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PinIcon } from "lucide-react";

import type { FeedPost } from "@/lib/db/queries/community-posts";
import {
  hideUnitPost,
  toggleCommunityReaction,
} from "@/app/(site)/dashboard/community/_actions/community-learner-actions";
import { reportContent } from "@/app/(site)/dashboard/community/_actions/discussion-actions";

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Africa/Lagos",
});

export function PostList({
  posts: initial,
  emptyText = "No posts yet.",
}: {
  posts: FeedPost[];
  emptyText?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [posts, setPosts] = useState(initial);

  function react(postId: number) {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              reactedByMe: !post.reactedByMe,
              reactionCount: post.reactionCount + (post.reactedByMe ? -1 : 1),
            }
          : post,
      ),
    );
    startTransition(async () => {
      try {
        await toggleCommunityReaction(postId);
      } finally {
        router.refresh();
      }
    });
  }

  function hide(post: FeedPost) {
    if (post.scope !== "unit") return;
    setPosts((current) => current.filter((p) => p.id !== post.id));
    startTransition(async () => {
      try {
        await hideUnitPost({ postId: post.id });
      } finally {
        router.refresh();
      }
    });
  }

  if (posts.length === 0) {
    return (
      <p className="rounded-sm border border-zinc-200 bg-white p-4 text-xs text-zinc-500">
        {emptyText}
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {posts.map((post) => (
        <li
          key={post.id}
          className="grid gap-2 rounded-sm border border-zinc-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-zinc-400">
            {post.pinned ? (
              <PinIcon className="size-3 text-[var(--color-brand-blue)]" />
            ) : null}
            <span>{post.authorName}</span>
            <span>· {post.scope === "unit" ? post.unitName ?? "Unit" : "Official"}</span>
            <span className="font-normal normal-case tracking-normal text-zinc-400">
              {dateFmt.format(new Date(post.publishedAt))}
            </span>
          </div>
          {post.title ? (
            <h2 className="ppc-heading text-sm font-semibold text-zinc-900">
              {post.title}
            </h2>
          ) : null}
          <p className="whitespace-pre-line text-sm leading-[1.6] text-zinc-700">
            {post.body}
          </p>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={pending}
              onClick={() => react(post.id)}
              aria-pressed={post.reactedByMe}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                post.reactedByMe
                  ? "border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]/5 text-[var(--color-brand-blue)]"
                  : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
              }`}
            >
              🙏 {post.reactionCount > 0 ? post.reactionCount : "Amen"}
            </button>
            {post.canManage && post.scope === "unit" ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => hide(post)}
                className="text-xs text-zinc-500 underline underline-offset-2"
              >
                Hide
              </button>
            ) : null}
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await reportContent({
                    targetType: "post",
                    targetId: post.id,
                    reason: "Reported from feed",
                  }).catch(() => {});
                  router.refresh();
                })
              }
              className="text-xs text-zinc-400 underline underline-offset-2"
            >
              Report
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
