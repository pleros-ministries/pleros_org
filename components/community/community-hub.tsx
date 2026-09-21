"use client";

import { useInfiniteQuery } from "@tanstack/react-query";

import type { FeedPost } from "@/lib/db/queries/community-posts";
import { dedupeFeed, type FeedPage } from "@/lib/community/feed";
import { communityKeys } from "@/lib/community/query-keys";

import { FeedComposer } from "./feed-composer";
import { PostList } from "./post-list";

type HubUnit = { id: number; name: string; telegramUrl: string | null } | null;

async function fetchFeedPage(offset: number): Promise<FeedPage> {
  const res = await fetch(`/api/community/feed?offset=${offset}`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to load the feed");
  return (await res.json()) as FeedPage;
}

export function CommunityHub({
  initialFeed,
  initialNextOffset,
  viewerName,
  unit,
  isUnitLeader,
  isAdmin,
}: {
  initialFeed: FeedPost[];
  initialNextOffset: number | null;
  viewerName: string;
  unit: HubUnit;
  isUnitLeader: boolean;
  isAdmin: boolean;
}) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: communityKeys.feed(),
      queryFn: ({ pageParam }) => fetchFeedPage(pageParam),
      initialPageParam: 0,
      getNextPageParam: (last) => last.nextOffset ?? undefined,
      initialData: {
        pages: [{ posts: initialFeed, nextOffset: initialNextOffset }],
        pageParams: [0],
      },
      refetchInterval: 20_000,
    });

  const posts = dedupeFeed(data.pages.flatMap((page) => page.posts));

  return (
    <div className="grid gap-4">
      <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
        Community
      </h1>

      {isAdmin || isUnitLeader ? (
        <FeedComposer
          viewerName={viewerName}
          unitName={unit?.name ?? null}
          defaultScope={isAdmin ? "global" : "unit"}
          lockScope={!isAdmin}
        />
      ) : null}

      <PostList
        posts={posts}
        viewerName={viewerName}
        viewerUnitName={unit?.name ?? null}
        canPost={isAdmin || isUnitLeader}
        isAdmin={isAdmin}
        emptyText="No posts yet. Check back soon for updates."
      />

      {hasNextPage && posts.length > 0 ? (
        <button
          type="button"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mx-auto rounded-full border border-(--color-line-strong) bg-white px-5 py-2 text-sm font-medium text-zinc-700 shadow-(--shadow-sm) transition-colors hover:bg-zinc-50 disabled:opacity-60"
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
