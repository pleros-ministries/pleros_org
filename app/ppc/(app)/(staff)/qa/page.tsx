"use client";

import { useMemo, useState } from "react";

import { DEMO_QA_THREADS, formatShortDate } from "@/lib/ppc-demo";

type QaFilter = "all" | "open" | "answered";

export default function PpcQaPage() {
  const [filter, setFilter] = useState<QaFilter>("all");

  const threads = useMemo(
    () =>
      DEMO_QA_THREADS.filter((thread) => {
        if (filter === "all") {
          return true;
        }

        return thread.status === filter;
      }),
    [filter],
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Q&A Inbox</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Private student-staff threads with status tracking.
          </p>
        </div>

        <label className="grid gap-1">
          <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
            Status
          </span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as QaFilter)}
            className="h-10 rounded border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-700"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="answered">Answered</option>
          </select>
        </label>
      </div>

      <section className="grid gap-3">
        {threads.map((thread) => (
          <article key={thread.id} className="rounded-sm border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">{thread.subject}</h3>
                <p className="mt-1 text-sm text-zinc-600">
                  {thread.studentName} - Level {thread.level}
                </p>
              </div>
              <span className="rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-medium text-zinc-700">
                {thread.status}
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Last updated {formatShortDate(thread.updatedAt)}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
