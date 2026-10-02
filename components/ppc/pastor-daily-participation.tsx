"use client";

import { Fragment, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  getPastorEnrolleeStatuses,
  getPastorSogpDailyParticipation,
} from "@/app/admin/(app)/(pastor-only)/_actions/pastor-daily-actions";
import { Count, Mark } from "@/components/ppc/admin-sogp-daily-by-pastor";
import { DetailGrid, ExpandButton, isDesktop } from "@/components/ppc/expandable-table-row";
import { clampDate, lagosToday, shiftDate } from "@/lib/sogp/daily-date";
import { summarizeDailyByPastor } from "@/lib/sogp/daily-participation";
import { fullnessLabel, matchesFullnessFilter, type FullnessFilter } from "@/lib/sogp/fullness";
import { STUDENT_STATUS_META } from "@/lib/sogp/student-status";

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
  fullnessFilter = "all",
}: {
  cohorts: CohortWindow[];
  pastorId: string;
  /** Applies the My Enrollees Fullness filter to this table and its totals. */
  fullnessFilter?: FullnessFilter;
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

  // Status reflects the recent pattern, not the picked date, so it's keyed
  // without `date` and doesn't refetch while stepping through days.
  const { data: statuses } = useQuery({
    queryKey: ["pastor", "sogp", "statuses", pastorId, cohort?.id],
    queryFn: () => getPastorEnrolleeStatuses(cohort!.id, pastorId),
    enabled: Boolean(cohort),
  });
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | "total" | null>(null);
  const toggle = (id: number | "total") => setExpandedId((current) => (current === id ? null : id));

  const rows = useMemo(
    () => (data ? data.filter((row) => matchesFullnessFilter(row.fullness, fullnessFilter)) : null),
    [data, fullnessFilter],
  );
  const summary = useMemo(() => (rows ? summarizeDailyByPastor(rows).total : null), [rows]);

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
        <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
          {cohorts.length > 1 ? (
            <label className="grid w-full gap-1 text-xs font-medium text-zinc-700 sm:w-auto">
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
                className="h-8 w-full rounded-sm border border-zinc-200 bg-white px-2 text-xs sm:w-auto"
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
          <label className="grid min-w-0 flex-1 gap-1 text-xs font-medium text-zinc-700 sm:flex-none">
            Date
            <input
              type="date"
              value={date}
              min={minDate}
              max={maxDate}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              className="h-8 w-full min-w-0 rounded-sm border border-zinc-200 bg-white px-2 text-xs"
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
        <p className="px-4 py-8 text-center text-xs text-zinc-500">
          {data?.length ? "No enrollees match this Fullness filter." : "No enrollees in this cohort."}
        </p>
      ) : null}

      {rows && summary && summary.enrollees ? (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-3 py-3 md:px-4">Enrollee</th>
                <th className="hidden px-4 py-3 md:table-cell">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">Prayer watch</th>
                <th
                  className="hidden px-4 py-3 md:table-cell"
                  title="Listening isn't date-stamped. Shows who has listened to the lesson released on this day, as of now."
                >
                  Listened*
                </th>
                <th className="hidden px-4 py-3 md:table-cell">Quiz taken</th>
                <th className="hidden px-4 py-3 md:table-cell">Written submitted</th>
                <th className="hidden px-4 py-3 md:table-cell">Written approved</th>
                <th className="hidden px-4 py-3 md:table-cell">Review</th>
                <th className="px-3 py-3 text-right md:hidden">Done</th>
                <th className="w-8 px-2 py-3 md:hidden">
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row) => {
                const activities = [
                  row.prayerWatch,
                  row.listened,
                  row.quizAttempted,
                  row.writtenSubmitted,
                  row.writtenApproved,
                  row.reviewAttended,
                ].filter((value): value is boolean => value !== null);
                const done = activities.filter(Boolean).length;
                const active = done > 0;
                const status = statuses?.[row.enrollmentId];
                const statusPill = status ? (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[0.65rem] font-semibold text-zinc-700">
                    {STUDENT_STATUS_META[status].emoji} {STUDENT_STATUS_META[status].label}
                  </span>
                ) : null;
                const detailHref = `/admin/my-enrollees/${row.enrollmentId}`;
                const expanded = expandedId === row.enrollmentId;
                const detailsId = `daily-participation-${row.enrollmentId}`;
                const rowTone = active ? "" : "bg-rose-50";
                return (
                  <Fragment key={row.enrollmentId}>
                    <tr
                      onClick={() =>
                        isDesktop() ? router.push(detailHref) : toggle(row.enrollmentId)
                      }
                      className={`cursor-pointer ${rowTone} ${active ? "hover:bg-zinc-50" : "hover:bg-rose-100/70"} ${expanded ? "border-b-0" : ""}`}
                    >
                      <td className="px-3 py-3 md:px-4">
                        <Link
                          href={detailHref}
                          onClick={(event) => event.stopPropagation()}
                          className="block max-w-[11rem] truncate font-medium text-zinc-900 hover:underline sm:max-w-none"
                        >
                          {row.name}
                        </Link>
                        <p className="max-w-[11rem] truncate text-[10px] text-zinc-500 sm:max-w-none">
                          {row.email}
                          <span className="hidden md:inline">
                            {row.fullness ? ` · ${fullnessLabel(row.fullness)}` : ""}
                            {row.leaderboardAlias ? ` · Leaderboard: ${row.leaderboardAlias}` : ""}
                          </span>
                        </p>
                        {statusPill ? <div className="mt-1 md:hidden">{statusPill}</div> : null}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        {statusPill ?? <span className="text-zinc-300">—</span>}
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <Mark value={row.prayerWatch} />
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <Mark value={row.listened} />
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <Mark value={row.quizAttempted} />
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <Mark value={row.writtenSubmitted} />
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <Mark value={row.writtenApproved} />
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <Mark value={row.reviewAttended} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right md:hidden">
                        <span className={active ? "font-medium text-zinc-900" : "text-rose-700"}>
                          {done}/{activities.length}
                        </span>
                      </td>
                      <td className="px-2 py-3 md:hidden">
                        <ExpandButton
                          expanded={expanded}
                          controls={detailsId}
                          label={`activities for ${row.name}`}
                          onToggle={() => toggle(row.enrollmentId)}
                        />
                      </td>
                    </tr>
                    {expanded ? (
                      <tr id={detailsId} className={`md:hidden ${rowTone}`}>
                        <td colSpan={10} className="px-3 pb-3 pt-0">
                          <DetailGrid
                            items={[
                              ["Prayer watch", <Mark key="p" value={row.prayerWatch} />],
                              ["Listened*", <Mark key="l" value={row.listened} />],
                              ["Quiz taken", <Mark key="q" value={row.quizAttempted} />],
                              ["Written submitted", <Mark key="ws" value={row.writtenSubmitted} />],
                              ["Written approved", <Mark key="wa" value={row.writtenApproved} />],
                              ["Review", <Mark key="r" value={row.reviewAttended} />],
                            ]}
                          />
                          <p className="mt-2 text-[11px] text-zinc-500">
                            Fullness: <span className="font-medium text-zinc-700">{fullnessLabel(row.fullness)}</span>
                            {row.leaderboardAlias ? (
                              <>
                                {" · "}Leaderboard: <span className="font-medium text-zinc-700">{row.leaderboardAlias}</span>
                              </>
                            ) : null}
                          </p>
                          <Link
                            href={detailHref}
                            className="mt-2 inline-block text-[11px] font-medium text-[var(--color-brand-blue)] hover:underline"
                          >
                            View daily performance →
                          </Link>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
              <tr
                onClick={() => {
                  if (!isDesktop()) toggle("total");
                }}
                className={`bg-zinc-50 font-medium ${expandedId === "total" ? "border-b-0" : ""}`}
              >
                <td className="px-3 py-3 text-zinc-900 md:px-4">All enrollees</td>
                <td className="hidden px-4 py-3 md:table-cell" />
                <td className="hidden px-4 py-3 md:table-cell">
                  <Count n={summary.prayerWatch} of={summary.enrollees} />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Count n={summary.listened} of={summary.enrollees} applicable={summary.listenedApplicable} />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Count n={summary.quizAttempted} of={summary.enrollees} />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Count n={summary.writtenSubmitted} of={summary.enrollees} />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Count n={summary.writtenApproved} of={summary.enrollees} />
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <Count n={summary.reviewAttended} of={summary.enrollees} />
                </td>
                <td className="px-3 py-3 text-right text-zinc-500 md:hidden">{summary.enrollees}</td>
                <td className="px-2 py-3 md:hidden">
                  <ExpandButton
                    expanded={expandedId === "total"}
                    controls="daily-participation-total"
                    label="totals for all enrollees"
                    onToggle={() => toggle("total")}
                  />
                </td>
              </tr>
              {expandedId === "total" ? (
                <tr id="daily-participation-total" className="bg-zinc-50 md:hidden">
                  <td colSpan={10} className="px-3 pb-3 pt-0">
                    <DetailGrid
                      items={[
                        ["Prayer watch", <Count key="p" n={summary.prayerWatch} of={summary.enrollees} />],
                        [
                          "Listened*",
                          <Count key="l" n={summary.listened} of={summary.enrollees} applicable={summary.listenedApplicable} />,
                        ],
                        ["Quiz taken", <Count key="q" n={summary.quizAttempted} of={summary.enrollees} />],
                        ["Written submitted", <Count key="ws" n={summary.writtenSubmitted} of={summary.enrollees} />],
                        ["Written approved", <Count key="wa" n={summary.writtenApproved} of={summary.enrollees} />],
                        ["Review", <Count key="r" n={summary.reviewAttended} of={summary.enrollees} />],
                      ]}
                    />
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="border-t border-zinc-100 px-4 py-2 text-[10px] text-zinc-500">
        <span className="md:hidden">Tap an enrollee to see their activities; Done counts the activities they did that day. </span>
        *Listening isn&rsquo;t date-stamped, so this shows who has listened to the lesson released on this day, as of
        now (&ldquo;—&rdquo; when no lesson was released). Quiz counts anyone who took a quiz that day; review counts
        the day it was attended or marked. Prayer watch is morning sessions. Enrollees with no activity that day are
        highlighted. Status is set automatically from the last few days of participation; select an enrollee to see
        their day-by-day performance.
      </p>
    </section>
  );
}
