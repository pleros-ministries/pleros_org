"use client";

import type { FeedPost } from "@/lib/db/queries/community-posts";

import { PostCard } from "./post-card";

export function PostList({
  posts,
  viewerName = "You",
  viewerUnitName = null,
  canRepost = false,
  isAdmin = false,
  emptyText = "No posts yet.",
}: {
  posts: FeedPost[];
  viewerName?: string;
  viewerUnitName?: string | null;
  canRepost?: boolean;
  isAdmin?: boolean;
  emptyText?: string;
}) {
  if (posts.length === 0) {
    return (
      <p className="rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-4 py-3.5 text-[13px] text-[var(--color-community-muted)] ">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5 sm:gap-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          viewerName={viewerName}
          viewerUnitName={viewerUnitName}
          canRepost={canRepost}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
