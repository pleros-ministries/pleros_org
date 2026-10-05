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
    <div className="grid gap-4">
      <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
        Community
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
