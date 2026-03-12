"use client";

import { useMemo, useState } from "react";

import { DEMO_REVIEW_QUEUE, formatShortDate } from "@/lib/ppc-demo";

type ReviewFilter = "all" | "pending" | "in_review" | "needs_revision";

export default function PpcReviewPage() {
  const [filter, setFilter] = useState<ReviewFilter>("all");

  const items = useMemo(
    () =>
      DEMO_REVIEW_QUEUE.filter((item) => {
        if (filter === "all") {
          return true;
        }

        return item.status === filter;
      }),
    [filter],
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Review Queue</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Unified grading queue for short-text and written submissions.
          </p>
        </div>

        <label className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
            Filter
          </span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as ReviewFilter)}
            className="h-10 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-700"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="in_review">In review</option>
            <option value="needs_revision">Needs revision</option>
          </select>
        </label>
      </div>

      <section className="grid gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-zinc-200 bg-white p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-zinc-900">
                {item.studentName} - Level {item.level} - {item.lesson}
              </p>
              <span className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700">
                {item.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-2 text-sm text-zinc-600">
              {item.type === "short_text" ? "Short text" : "Written response"} submission
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Submitted {formatShortDate(item.submittedAt)}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
