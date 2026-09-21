"use client";

import { Fragment, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";

import { getAdminSogpDailyParticipation } from "@/app/admin/_actions/sogp-report-actions";
import { summarizeDailyByPastor, type DailyPastorSummary } from "@/lib/sogp/daily-participation";

type CohortWindow = { id: number; title: string; startsAt: string; endsAt: string };

function lagosToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lagos" }).format(new Date());
}

function shiftDate(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function clamp(value: string, min: string, max: string) {
  return value < min ? min : value > max ? max : value;
}

function Mark({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-zinc-300">—</span>;
  return <span className={value ? "font-medium text-emerald-700" : "text-zinc-400"}>{value ? "Yes" : "No"}</span>;
}

function Count({ n, of, applicable = true }: { n: number; of: number; applicable?: boolean }) {
  if (!applicable) return <span className="text-zinc-300">—</span>;
  const percent = of ? Math.round((n / of) * 100) : 0;
  return (
    <>
      <span className="font-medium text-zinc-900">{n}</span>
      <span className="ml-1 text-[10px] text-zinc-500">({percent}%)</span>
    </>
  );
}

function SummaryCells({ summary }: { summary: DailyPastorSummary }) {
  return (
    <>
      <td className="px-4 py-3">{summary.enrollees}</td>
      <td className="px-4 py-3"><Count n={summary.prayerWatch} of={summary.enrollees} /></td>
      <td className="px-4 py-3">
        <Count n={summary.listened} of={summary.enrollees} applicable={summary.listenedApplicable} />
      </td>
      <td className="px-4 py-3"><Count n={summary.quizAttempted} of={summary.enrollees} /></td>
      <td className="px-4 py-3"><Count n={summary.writtenSubmitted} of={summary.enrollees} /></td>
      <td className="px-4 py-3"><Count n={summary.writtenApproved} of={summary.enrollees} /></td>
      <td className="px-4 py-3"><Count n={summary.reviewAttended} of={summary.enrollees} /></td>
    </>
  );
}

export function DailyByPastorSection({ cohort }: { cohort: CohortWindow }) {
  const minDate = cohort.startsAt.slice(0, 10);
  const maxDate = cohort.endsAt.slice(0, 10);
  const [date, setDate] = useState(() => clamp(lagosToday(), minDate, maxDate));
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "sogp", "report", "daily", cohort.id, date],
    queryFn: () => getAdminSogpDailyParticipation(cohort.id, date),
    placeholderData: keepPreviousData,
  });

  const summary = useMemo(() => (data ? summarizeDailyByPastor(data) : null), [data]);

  async function exportDay() {
    setExporting(true);
    setExportError(null);
    try {
      const response = await fetch(`/api/admin/sogp/report/daily-export?cohortId=${cohort.id}&date=${date}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Export failed");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `sogp-daily-${date}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const stepButton = "inline-flex h-8 items-center rounded-sm border border-zinc-200 bg-white px-2 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40";

  return (
    <section className="rounded-sm border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div>
          <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Daily by pastor — {cohort.title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Pick a day to see how each pastor&rsquo;s enrollees took part. Click a pastor to see who did and who
            didn&rsquo;t.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <button type="button" aria-label="Previous day" disabled={date <= minDate} onClick={() => setDate(shiftDate(date, -1))} className={stepButton}>
            <ChevronLeft className="size-3.5" />
          </button>
          <label className="grid gap-1 text-xs font-medium text-zinc-700">
            Date
            <input
              type="date"
              value={date}
              min={minDate}
              max={maxDate}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              className="h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs"
            />
          </label>
          <button type="button" aria-label="Next day" disabled={date >= maxDate} onClick={() => setDate(shiftDate(date, 1))} className={stepButton}>
            <ChevronRight className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={exportDay}
            disabled={exporting}
            className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            <Download className="size-3.5" />
            {exporting ? "Preparing…" : "Export this day"}
          </button>
        </div>
      </div>
      {exportError ? <p className="px-4 pt-2 text-[10px] text-rose-700">{exportError}</p> : null}

      {isLoading && !summary ? <p className="px-4 py-8 text-center text-xs text-zinc-500">Loading…</p> : null}
      {error ? <p className="px-4 py-8 text-center text-xs text-rose-700">Could not load this day.</p> : null}
      {summary && !summary.total.enrollees ? (
        <p className="px-4 py-8 text-center text-xs text-zinc-500">No enrollees in this cohort.</p>
      ) : null}

      {summary && summary.total.enrollees ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3">Pastor</th>
                <th className="px-4 py-3">Enrollees</th>
                <th className="px-4 py-3">Prayer watch</th>
                <th className="px-4 py-3" title="Listening isn't date-stamped. Shows who has listened to the lesson released on this day, as of now.">
                  Listened*
                </th>
                <th className="px-4 py-3">Quiz taken</th>
                <th className="px-4 py-3">Written submitted</th>
                <th className="px-4 py-3">Written approved</th>
                <th className="px-4 py-3">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {summary.pastors.map((pastor) => {
                const key = pastor.pastorId ?? "unassigned";
                const open = expanded === key;
                const members = open ? (data ?? []).filter((row) => (row.pastorId ?? "unassigned") === key) : [];
                return (
                  <Fragment key={key}>
                    <tr onClick={() => setExpanded(open ? null : key)} className="cursor-pointer hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        <ChevronRight className={`mr-1 inline size-3 text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`} />
                        {pastor.pastorName}
                      </td>
                      <SummaryCells summary={pastor} />
                    </tr>
                    {open ? (
                      <tr>
                        <td colSpan={8} className="bg-zinc-50 px-4 py-3">
                          <table className="min-w-full text-left text-xs">
                            <thead className="text-zinc-500">
                              <tr>
                                <th className="py-1.5 pr-4">Enrollee</th>
                                <th className="py-1.5 pr-4">Prayer watch</th>
                                <th className="py-1.5 pr-4">Listened*</th>
                                <th className="py-1.5 pr-4">Quiz</th>
                                <th className="py-1.5 pr-4">Written submitted</th>
                                <th className="py-1.5 pr-4">Written approved</th>
                                <th className="py-1.5">Review</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                              {members.map((row) => {
                                const active =
                                  row.prayerWatch || row.listened === true || row.quizAttempted ||
                                  row.writtenSubmitted || row.writtenApproved || row.reviewAttended;
                                return (
                                  <tr key={row.enrollmentId} className={active ? "" : "bg-rose-50"}>
                                    <td className="py-1.5 pr-4">
                                      <p className="font-medium text-zinc-900">{row.name}</p>
                                      <p className="text-[10px] text-zinc-500">{row.email}</p>
                                    </td>
                                    <td className="py-1.5 pr-4"><Mark value={row.prayerWatch} /></td>
                                    <td className="py-1.5 pr-4"><Mark value={row.listened} /></td>
                                    <td className="py-1.5 pr-4"><Mark value={row.quizAttempted} /></td>
                                    <td className="py-1.5 pr-4"><Mark value={row.writtenSubmitted} /></td>
                                    <td className="py-1.5 pr-4"><Mark value={row.writtenApproved} /></td>
                                    <td className="py-1.5"><Mark value={row.reviewAttended} /></td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              <tr className="bg-zinc-50 font-medium">
                <td className="px-4 py-3 text-zinc-900">All enrollees</td>
                <SummaryCells summary={summary.total} />
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="border-t border-zinc-100 px-4 py-2 text-[10px] text-zinc-500">
        *Listening isn&rsquo;t date-stamped, so this shows who has listened to the lesson released on this day, as of
        now (&ldquo;—&rdquo; when no lesson was released). Quiz counts anyone who took a quiz that day; review counts
        the day it was attended or marked. Prayer watch is morning sessions. Enrollees with no activity that day are
        highlighted.
      </p>
    </section>
  );
}
