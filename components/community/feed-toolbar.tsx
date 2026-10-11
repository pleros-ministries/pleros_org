"use client";

import {
  FEED_FILTERS,
  FEED_FILTER_LABELS,
  FEED_SORTS,
  FEED_SORT_LABELS,
  parseFeedView,
  type FeedView,
} from "@/lib/community/feed-view";

/** One post-type filter rail, with sorting in a compact native dropdown. */
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
              className={`h-7 rounded-full border px-2.5 text-[12.5px] font-medium transition-colors ${
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

      <select
        aria-label="Sort posts"
        value={view.sort}
        onChange={(event) =>
          onChange(parseFeedView({ sort: event.target.value, filter: view.filter }))
        }
        className="h-7 max-w-[145px] rounded-md border border-(--color-line-strong) bg-white pl-2.5 text-[12.5px] font-medium text-(--color-text-strong) focus-visible:outline-2 focus-visible:outline-(--color-brand-blue)"
      >
        {FEED_SORTS.map((sort) => (
          <option key={sort} value={sort}>{FEED_SORT_LABELS[sort]}</option>
        ))}
      </select>
    </div>
  );
}
