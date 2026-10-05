"use client";

import {
  FEED_FILTERS,
  FEED_FILTER_LABELS,
  FEED_SORTS,
  FEED_SORT_LABELS,
  parseFeedView,
  type FeedView,
} from "@/lib/community/feed-view";

/** Filter chips (All / Official / Discussions) and sort tabs for a feed. */
export function FeedToolbar({
  view,
  onChange,
}: {
  view: FeedView;
  onChange: (view: FeedView) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
      <div
        role="group"
        aria-label="Filter posts"
        className="flex items-center gap-1.5"
      >
        {FEED_FILTERS.map((filter) => {
          const active = view.filter === filter;
          return (
            <button
              key={filter}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange(
                  parseFeedView({
                    // "Unanswered" has no official posts, so fall back to Latest.
                    sort:
                      filter === "official" && view.sort === "unanswered"
                        ? "latest"
                        : view.sort,
                    filter,
                  }),
                )
              }
              className={`h-8 rounded-full border px-3 text-[13px] font-medium transition-colors ${
                active
                  ? "border-(--color-brand-blue) bg-(--color-brand-blue) text-white"
                  : "border-(--color-line-strong) bg-white text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              {FEED_FILTER_LABELS[filter]}
            </button>
          );
        })}
      </div>

      <div
        role="group"
        aria-label="Sort posts"
        className="flex items-center gap-0.5 rounded-full border border-(--color-line-strong) bg-white p-0.5"
      >
        {FEED_SORTS.map((sort) => {
          const active = view.sort === sort;
          return (
            <button
              key={sort}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange(parseFeedView({ sort, filter: view.filter }))
              }
              className={`h-7 rounded-full px-2.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-(--muted) text-(--color-brand-blue)"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              {FEED_SORT_LABELS[sort]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
