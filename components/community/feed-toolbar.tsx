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
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl border border-[var(--color-community-edge)] bg-white p-3">
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
              className={`inline-flex min-h-[28px] items-center rounded-full px-2.5 text-[14px] font-medium transition-colors ${
                active
                  ? "bg-[var(--color-community-blue)] text-white"
                  : "text-[var(--color-community-ink)]"
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
        className="inline-flex min-h-9 max-w-[145px] items-center rounded-md border border-[var(--color-community-edge)] bg-white pl-2.5 text-[12px] font-medium text-[var(--color-community-ink)]"
      >
        {FEED_SORTS.map((sort) => (
          <option key={sort} value={sort}>{FEED_SORT_LABELS[sort]}</option>
        ))}
      </select>
    </div>
  );
}
