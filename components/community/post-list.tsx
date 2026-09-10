"use client";

import type { FeedPost } from "@/lib/db/queries/community-posts";

import { PostCard } from "./post-card";

export function PostList({
  posts,
  viewerName = "You",
  viewerUnitName = null,
  canPost = false,
  isAdmin = false,
  emptyText = "No posts yet.",
}: {
  posts: FeedPost[];
  viewerName?: string;
  viewerUnitName?: string | null;
  canPost?: boolean;
  isAdmin?: boolean;
  emptyText?: string;
}) {
  if (posts.length === 0) {
    return (
      <p className="rounded-2xl border border-(--color-line-strong) bg-white p-5 text-sm text-zinc-500 shadow-(--shadow-sm)">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:gap-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          viewerName={viewerName}
          viewerUnitName={viewerUnitName}
          canPost={canPost}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
