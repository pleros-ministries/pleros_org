"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import type { FeedPost } from "@/lib/db/queries/community-posts";
import { dedupeFeed, type FeedPage } from "@/lib/community/feed";
import {
  DEFAULT_FEED_VIEW,
  feedViewParams,
  isDefaultFeedView,
  type FeedView,
} from "@/lib/community/feed-view";
import { communityKeys } from "@/lib/community/query-keys";

import { FeedToolbar } from "./feed-toolbar";
import { PostList } from "./post-list";

/** Which feed to show: the community, or one location, discipleship or member group. */
export type FeedSource =
  | { type: "community" }
  | { type: "unit"; id: number }
  | { type: "discipleship"; id: number }
  | { type: "group"; id: number };

function sourceKey(source: FeedSource): string {
  return source.type === "community" ? "community" : `${source.type}:${source.id}`;
}

function sourcePath(source: FeedSource): string {
  if (source.type === "unit") return `/api/community/unit/${source.id}`;
  if (source.type === "discipleship") {
    return `/api/community/discipleship/${source.id}`;
  }
  if (source.type === "group") return `/api/community/groups/${source.id}`;
  return "/api/community/feed";
}

async function fetchFeedPage(
  source: FeedSource,
  view: FeedView,
  offset: number,
): Promise<FeedPage> {
  const res = await fetch(
    `${sourcePath(source)}?offset=${offset}&${feedViewParams(view)}`,
    { credentials: "same-origin" },
  );
  if (!res.ok) throw new Error("Failed to load the feed");
  return (await res.json()) as FeedPage;
}

function emptyTextFor(view: FeedView, fallback: string): string {
  if (view.sort === "unanswered") return "Every discussion has a reply so far.";
  if (view.sort === "top") return "Nothing has been posted in the last 30 days.";
  if (view.filter === "discussions") {
    return "No discussions yet. Be the first to start one.";
  }
  if (view.filter === "official") return "No official posts yet.";
  return fallback;
}

const COMMUNITY_SOURCE: FeedSource = { type: "community" };

/**
 * A sortable, filterable, paginated feed for one source. When the server
 * passes the first page of the default view it shows at once; otherwise, and
 * for every other view, pages load on demand.
 */
export function PostFeed({
  source = COMMUNITY_SOURCE,
  initialPosts,
  initialNextOffset = null,
  viewerName,
  viewerUnitName,
  canRepost,
  isAdmin,
  emptyText = "No posts yet.",
}: {
  source?: FeedSource;
  /** Omit to fetch the first page in the browser. */
  initialPosts?: FeedPost[];
  initialNextOffset?: number | null;
  viewerName: string;
  viewerUnitName: string | null;
  canRepost: boolean;
  isAdmin: boolean;
  emptyText?: string;
}) {
  const [view, setView] = useState<FeedView>(DEFAULT_FEED_VIEW);

  const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: communityKeys.feed(sourceKey(source), view),
      queryFn: ({ pageParam }) => fetchFeedPage(source, view, pageParam),
      initialPageParam: 0,
      getNextPageParam: (last) => last.nextOffset ?? undefined,
      initialData:
        initialPosts && isDefaultFeedView(view)
        ? {
            pages: [{ posts: initialPosts, nextOffset: initialNextOffset }],
            pageParams: [0],
          }
        : undefined,
      refetchInterval: 20_000,
    });

  const posts = dedupeFeed(data?.pages.flatMap((page) => page.posts) ?? []);

  return (
    <div className="grid gap-4">
      <FeedToolbar view={view} onChange={setView} />

      {isPending ? (
        <p className="rounded-2xl border border-(--color-line-strong) bg-white p-5 text-sm text-zinc-400 shadow-(--shadow-sm)">
          Loading posts…
        </p>
      ) : isError && posts.length === 0 ? (
        <p className="rounded-2xl border border-(--color-line-strong) bg-white p-5 text-sm text-zinc-500 shadow-(--shadow-sm)">
          Couldn&apos;t load posts.{" "}
          <button
            type="button"
            onClick={() => refetch()}
            className="underline underline-offset-2 hover:text-zinc-700"
          >
            Retry
          </button>
        </p>
      ) : (
        <PostList
          posts={posts}
          viewerName={viewerName}
          viewerUnitName={viewerUnitName}
          canRepost={canRepost}
          isAdmin={isAdmin}
          emptyText={emptyTextFor(view, emptyText)}
        />
      )}

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
