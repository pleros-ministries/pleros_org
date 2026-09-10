import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import type { FeedPost } from "@/lib/db/queries/community-posts";

import { PostCard } from "./post-card";

export function PostDetail({
  post,
  viewerName,
  viewerUnitName,
  isAdmin,
}: {
  post: FeedPost;
  viewerName: string;
  viewerUnitName: string | null;
  isAdmin: boolean;
}) {
  return (
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <nav className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] shadow-sm">
        <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-4">
          <Link
            href="/dashboard/community"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 hover:text-white"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Community
          </Link>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-lime)]">
            Post
          </span>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page pb-6 pt-5">
        <div className="mx-auto max-w-2xl">
          <PostCard
            post={post}
            viewerName={viewerName}
            viewerUnitName={viewerUnitName}
            isAdmin={isAdmin}
            startExpanded
          />
        </div>
      </div>
    </section>
  );
}
