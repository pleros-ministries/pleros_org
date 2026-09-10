import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import type { FeedPost } from "@/lib/db/queries/community-posts";

import { PostCard } from "./post-card";

export function PostDetail({
  post,
  viewerName,
  viewerUnitName,
  canPost,
  isAdmin,
}: {
  post: FeedPost;
  viewerName: string;
  viewerUnitName: string | null;
  canPost: boolean;
  isAdmin: boolean;
}) {
  return (
    <div className="grid gap-3">
      <Link
        href="/dashboard/community"
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-[var(--color-brand-blue)]"
      >
        <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Back to feed
      </Link>
      <PostCard
        post={post}
        viewerName={viewerName}
        viewerUnitName={viewerUnitName}
        canPost={canPost}
        isAdmin={isAdmin}
        startExpanded
      />
    </div>
  );
}
