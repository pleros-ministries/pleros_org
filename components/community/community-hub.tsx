"use client";

import type { FeedPost } from "@/lib/db/queries/community-posts";

import { FeedComposer } from "./feed-composer";
import { PostFeed } from "./post-feed";

type HubUnit = { id: number; name: string; telegramUrl: string | null } | null;

export function CommunityHub({
  initialFeed,
  initialNextOffset,
  viewerName,
  unit,
  isUnitLeader,
  isAdmin,
  postingBlocked,
}: {
  initialFeed: FeedPost[];
  initialNextOffset: number | null;
  viewerName: string;
  unit: HubUnit;
  isUnitLeader: boolean;
  isAdmin: boolean;
  postingBlocked: boolean;
}) {
  return (
    <div className="grid gap-3.5">
      <h1 data-dashboard-page-title className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[21px] font-medium leading-[28px] tracking-[-0.02em] text-[var(--color-community-ink)]">
        Feed
      </h1>

      <FeedComposer
        viewerName={viewerName}
        unitName={unit?.name ?? null}
        officialReach={isAdmin ? "all" : isUnitLeader ? "unit" : "none"}
        postingBlocked={postingBlocked}
      />

      <PostFeed
        initialPosts={initialFeed}
        initialNextOffset={initialNextOffset}
        viewerName={viewerName}
        viewerUnitName={unit?.name ?? null}
        canRepost={isAdmin || isUnitLeader}
        isAdmin={isAdmin}
        emptyText="No posts yet. Start a discussion to get things going."
      />
    </div>
  );
}
