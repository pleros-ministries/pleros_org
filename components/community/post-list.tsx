"use client";

import type { FeedPost } from "@/lib/db/queries/community-posts";

import { PostCard } from "./post-card";

export function PostList({
  posts,
  viewerUnitName = null,
  isAdmin = false,
  emptyText = "No posts yet.",
}: {
  posts: FeedPost[];
  viewerUnitName?: string | null;
  isAdmin?: boolean;
  emptyText?: string;
}) {
  if (posts.length === 0) {
    return (
      <p className="rounded-sm border border-zinc-200 bg-white p-4 text-xs text-zinc-500">
        {emptyText}
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          viewerUnitName={viewerUnitName}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
}
