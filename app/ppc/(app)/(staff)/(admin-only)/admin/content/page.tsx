"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock3, FileCheck2 } from "lucide-react";

import { formatShortDate } from "@/lib/ppc-demo";
import {
  buildDemoContentLevels,
  publishLevelContent,
  setLevelDraft,
  summarizeContentLevels,
  type ContentLevelItem,
} from "@/lib/ppc-content-workflow";

export default function AdminContentPage() {
  const [levels, setLevels] = useState<ContentLevelItem[]>(() => buildDemoContentLevels());

  const summary = useMemo(() => summarizeContentLevels(levels), [levels]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/ppc/admin"
            className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.1em] text-zinc-500 hover:text-zinc-900"
          >
            <ArrowLeft className="size-3.5" />
            Back to admin
          </Link>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
            Levels & Lessons Content
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Draft/publish workflow. Publishing replaces content for all students immediately.
          </p>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Published levels</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{summary.published}</p>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">Draft levels</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-900">{summary.draft}</p>
        </article>

        <article className="rounded-xl border border-zinc-200 bg-white p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500">
                Publish behavior
              </p>
              <p className="mt-2 text-sm text-zinc-700">Immediate global replace</p>
            </div>
            <Clock3 className="size-4 text-zinc-500" />
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] divide-y divide-zinc-200 text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium">Lessons</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Last published</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {levels.map((level) => {
                const isPublished = level.status === "published";

                return (
                  <tr key={level.level} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-medium text-zinc-900">{level.title}</td>
                    <td className="px-4 py-3 text-zinc-700">{level.totalLessons}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          isPublished ? "bg-zinc-900 text-zinc-50" : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {level.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {level.lastPublishedAt ? formatShortDate(level.lastPublishedAt) : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setLevels((currentLevels) =>
                              publishLevelContent(
                                currentLevels,
                                level.level,
                                new Date().toISOString(),
                              ),
                            )
                          }
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-900 bg-zinc-900 px-2.5 text-xs font-medium text-zinc-50"
                        >
                          <FileCheck2 className="size-3.5" />
                          Publish now
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setLevels((currentLevels) => setLevelDraft(currentLevels, level.level))
                          }
                          className="inline-flex h-8 items-center rounded-md border border-zinc-300 bg-white px-2.5 text-xs font-medium text-zinc-700"
                        >
                          Move to draft
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
