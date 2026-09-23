"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getPastorSogpDailyParticipation } from "@/app/admin/(app)/(pastor-only)/_actions/pastor-daily-actions";
import { Count, Mark } from "@/components/ppc/admin-sogp-daily-by-pastor";
import { clampDate, lagosToday, shiftDate } from "@/lib/sogp/daily-date";
import { summarizeDailyByPastor } from "@/lib/sogp/daily-participation";

type CohortWindow = { id: number; title: string; startsAt: string; endsAt: string; status: string };

// "active" is the one cohort an admin has explicitly marked current — prefer
// that over guessing from date windows, since a newer cohort's prep period
// can start before the active one ends and would otherwise win a date-range
// check (cohorts are ordered newest-first).
function pickDefaultCohort(cohorts: CohortWindow[]): CohortWindow | null {
  if (!cohorts.length) return null;
  const active = cohorts.find((cohort) => cohort.status === "active");
  if (active) return active;
  const today = lagosToday();
  const current = cohorts.find(
    (cohort) => cohort.startsAt.slice(0, 10) <= today && today <= cohort.endsAt.slice(0, 10),
  );
  return current ?? cohorts[0]!;
}

export function PastorDailyParticipationSection({
  cohorts,
  pastorId,
}: {
  cohorts: CohortWindow[];
  pastorId: string;
}) {
  const [cohortId, setCohortId] = useState(() => pickDefaultCohort(cohorts)?.id ?? null);
  const cohort = cohorts.find((c) => c.id === cohortId) ?? null;

  const minDate = cohort ? cohort.startsAt.slice(0, 10) : lagosToday();
  const maxDate = cohort ? cohort.endsAt.slice(0, 10) : lagosToday();
  const [date, setDate] = useState(() => clampDate(lagosToday(), minDate, maxDate));

  const { data, isLoading, error } = useQuery({
    queryKey: ["pastor", "sogp", "daily", pastorId, cohort?.id, date],
    queryFn: () => getPastorSogpDailyParticipation(cohort!.id, date, pastorId),
    enabled: Boolean(cohort),
    placeholderData: keepPreviousData,
  });

  const summary = useMemo(() => (data ? summarizeDailyByPastor(data).total : null), [data]);

  if (!cohort) return null;

  const stepButton =
    "inline-flex h-8 items-center rounded-sm border border-zinc-200 bg-white px-2 text-zinc-600 hover:bg-zinc-50 disabled:opacity-40";

  return (
    <section className="rounded-sm border border-zinc-200 bg-white">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-100 px-4 py-3">
        <div>
          <h3 className="ppc-heading text-sm font-semibold text-zinc-900">Daily participation</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Pick a day to see which of your enrollees took part.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {cohorts.length > 1 ? (
            <label className="grid gap-1 text-xs font-medium text-zinc-700">
              Cohort
              <select
                value={cohort.id}
                onChange={(event) => {
                  const next = cohorts.find((c) => c.id === Number(event.target.value));
                  if (!next) return;
                  setCohortId(next.id);
                  setDate((current) =>
                    clampDate(current, next.startsAt.slice(0, 10), next.endsAt.slice(0, 10)),
                  );
                }}
                className="h-8 rounded-sm border border-zinc-200 bg-white px-2 text-xs"
              >
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <button
            type="button"
            aria-label="Previous day"
            disabled={date <= minDate}
            onClick={() => setDate(shiftDate(date, -1))}
            className={stepButton}
          >
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
          <button
            type="button"
            aria-label="Next day"
            disabled={date >= maxDate}
            onClick={() => setDate(shiftDate(date, 1))}
            className={stepButton}
          >
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      </div>

      {isLoading && !summary ? <p className="px-4 py-8 text-center text-xs text-zinc-500">Loading…</p> : null}
      {error ? <p className="px-4 py-8 text-center text-xs text-rose-700">Could not load this day.</p> : null}
      {summary && !summary.enrollees ? (
        <p className="px-4 py-8 text-center text-xs text-zinc-500">No enrollees in this cohort.</p>
      ) : null}

      {data && summary && summary.enrollees ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-4 py-3">Enrollee</th>
                <th className="px-4 py-3">Prayer watch</th>
                <th
                  className="px-4 py-3"
                  title="Listening isn't date-stamped. Shows who has listened to the lesson released on this day, as of now."
                >
                  Listened*
                </th>
                <th className="px-4 py-3">Quiz taken</th>
                <th className="px-4 py-3">Written submitted</th>
                <th className="px-4 py-3">Written approved</th>
                <th className="px-4 py-3">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {data.map((row) => {
                const active =
                  row.prayerWatch ||
                  row.listened === true ||
                  row.quizAttempted ||
                  row.writtenSubmitted ||
                  row.writtenApproved ||
                  row.reviewAttended;
                return (
                  <tr key={row.enrollmentId} className={active ? "" : "bg-rose-50"}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">{row.name}</p>
                      <p className="text-[10px] text-zinc-500">{row.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Mark value={row.prayerWatch} />
                    </td>
                    <td className="px-4 py-3">
                      <Mark value={row.listened} />
                    </td>
                    <td className="px-4 py-3">
                      <Mark value={row.quizAttempted} />
                    </td>
                    <td className="px-4 py-3">
                      <Mark value={row.writtenSubmitted} />
                    </td>
                    <td className="px-4 py-3">
                      <Mark value={row.writtenApproved} />
                    </td>
                    <td className="px-4 py-3">
                      <Mark value={row.reviewAttended} />
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-zinc-50 font-medium">
                <td className="px-4 py-3 text-zinc-900">All enrollees</td>
                <td className="px-4 py-3">
                  <Count n={summary.prayerWatch} of={summary.enrollees} />
                </td>
                <td className="px-4 py-3">
                  <Count n={summary.listened} of={summary.enrollees} applicable={summary.listenedApplicable} />
                </td>
                <td className="px-4 py-3">
                  <Count n={summary.quizAttempted} of={summary.enrollees} />
                </td>
                <td className="px-4 py-3">
                  <Count n={summary.writtenSubmitted} of={summary.enrollees} />
                </td>
                <td className="px-4 py-3">
                  <Count n={summary.writtenApproved} of={summary.enrollees} />
                </td>
                <td className="px-4 py-3">
                  <Count n={summary.reviewAttended} of={summary.enrollees} />
                </td>
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
