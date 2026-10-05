import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import type { FeedPost } from "@/lib/db/queries/community-posts";

import { PostCard } from "./post-card";

export function PostDetail({
  post,
  viewerName,
  viewerUnitName,
  canRepost,
  isAdmin,
}: {
  post: FeedPost;
  viewerName: string;
  viewerUnitName: string | null;
  canRepost: boolean;
  isAdmin: boolean;
}) {
  const back =
    post.scope === "discipleship"
      ? { href: "/dashboard/community/discipleship", label: "Back to discipleship" }
      : post.scope === "group" && post.groupId != null
        ? {
            href: `/dashboard/community/groups/${post.groupId}`,
            label: `Back to ${post.groupName ?? "group"}`,
          }
        : { href: "/dashboard/community", label: "Back to feed" };

  return (
    <div className="grid gap-3">
      <Link
        href={back.href}
        className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-[var(--color-brand-blue)]"
      >
        <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> {back.label}
      </Link>
      <PostCard
        post={post}
        viewerName={viewerName}
        viewerUnitName={viewerUnitName}
        canRepost={canRepost}
        isAdmin={isAdmin}
        startExpanded
      />
    </div>
  );
}
