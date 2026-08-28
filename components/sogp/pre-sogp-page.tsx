"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { DownloadIcon, ExternalLinkIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

import type { PreSogpJourneyData } from "@/lib/db/queries/sogp-journey";
import { deriveSogpCalendarState } from "@/lib/sogp/calendar";
import { getPreparationRequirements } from "@/lib/sogp/journey";
import { PRAYER_WATCH_YOUTUBE_URL } from "@/lib/prayer-watch";

import { SogpCalendar } from "./sogp-calendar";
import { SogpDailyRequirements } from "./sogp-daily-requirements";

const queryKey = ["sogp", "preparation"] as const;

async function fetchPreparation() {
  const response = await fetch("/api/sogp/preparation", { credentials: "same-origin" });
  if (!response.ok) throw new Error("Your Pre-SOGP journey could not load.");
  return response.json() as Promise<PreSogpJourneyData>;
}

async function saveCompletion(input: {
  kind: "lesson" | "prayer";
  dayId: number | null;
  dateKey: string;
  complete: boolean;
}) {
  const response = await fetch(
    input.kind === "lesson"
      ? `/api/sogp/preparation/${input.dayId}/completion`
      : "/api/sogp/prayer-watch",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        input.kind === "lesson"
          ? { complete: input.complete }
          : { dateKey: input.dateKey, complete: input.complete },
      ),
    },
  );
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Progress could not be saved.");
  return input;
}

export function PreSogpPage() {
  const { data } = useSuspenseQuery({ queryKey, queryFn: fetchPreparation });
  const searchParams = useSearchParams();
  const requestedDate = searchParams.get("date");
  const initialDate =
    data.days.find((day) => day.dateKey === requestedDate)?.dateKey ??
    data.days.find((day) => day.dateKey === data.todayKey)?.dateKey ??
    [...data.days].reverse().find((day) => day.dateKey <= data.todayKey)?.dateKey ??
    data.days[0]!.dateKey;
  const [selectedDateKey, setSelectedDateKey] = useState(initialDate);
  const queryClient = useQueryClient();
  const selectedDay =
    data.days.find((day) => day.dateKey === selectedDateKey) ?? data.days[0]!;

  const completionMutation = useMutation({
    mutationFn: saveCompletion,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PreSogpJourneyData>(queryKey);
      queryClient.setQueryData<PreSogpJourneyData>(queryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          days: current.days.map((day) => {
            if (day.dateKey !== input.dateKey) return day;
            const lessonComplete =
              input.kind === "lesson" ? input.complete : day.lessonComplete;
            const prayerWatchComplete =
              input.kind === "prayer" ? input.complete : day.prayerWatchComplete;
            return {
              ...day,
              lessonComplete,
              prayerWatchComplete,
              state: deriveSogpCalendarState({
                dateKey: day.dateKey,
                todayKey: current.todayKey,
                requirements: getPreparationRequirements({
                  lessonComplete,
                  prayerWatchComplete,
                }),
              }),
            };
          }),
        };
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const completeDays = data.days.filter((day) => day.state === "complete").length;
  const isFuture = selectedDay.dateKey > data.todayKey;

  return (
    <section className="site-font-theme min-h-screen bg-[var(--color-surface)] pb-16">
      <div className="site-shell-page sogp-shell-page grid gap-6 py-7 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start">
        <header
          data-pre-sogp-section="countdown"
          className="sticky top-0 z-20 -mx-[var(--site-shell-padding-x)] grid gap-1 border-b border-[var(--color-line)] bg-white/95 px-[var(--site-shell-padding-x)] py-4 backdrop-blur-sm md:-mx-[var(--site-shell-padding-x-md)] md:px-[var(--site-shell-padding-x-md)] lg:static lg:col-span-2 lg:mx-0 lg:rounded-[var(--radius-md)] lg:border lg:px-6"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">
            Pre-SOGP Lessons
          </p>
          <h1 className="font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.045em] text-[var(--color-text-strong)]">
            {data.countdown.label}
          </h1>
        </header>

        <aside
          data-pre-sogp-section="calendar"
          className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-4 lg:sticky lg:top-5"
        >
          <SogpCalendar
            days={data.days}
            selectedDateKey={selectedDateKey}
            todayKey={data.todayKey}
            onSelect={setSelectedDateKey}
          />
        </aside>

        <main data-pre-sogp-section="daily-content" className="grid gap-5">
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">
              Day {selectedDay.dayNumber} · {selectedDay.dateKey}
            </p>
            <h2 className="font-[var(--font-sen)] text-3xl font-semibold tracking-[-0.055em] text-[var(--color-text-strong)]">
              {selectedDay.lesson?.title ?? (isFuture ? "This lesson opens on its date" : "Today’s lesson is being prepared")}
            </h2>
          </div>

          {selectedDay.lesson ? (
            <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white">
              <video controls playsInline preload="metadata" src={selectedDay.lesson.url} className="aspect-video w-full bg-black" />
              <div className="grid gap-3 p-4">
                {selectedDay.lesson.description ? (
                  <p className="text-sm leading-[1.55] text-[var(--color-text-muted)]">{selectedDay.lesson.description}</p>
                ) : null}
                <a href={selectedDay.lesson.url} download className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-[var(--color-brand-blue)] px-4 text-xs font-semibold text-[var(--color-brand-blue)]">
                  <DownloadIcon className="size-4" /> Download teaching
                </a>
              </div>
            </section>
          ) : null}

          <a href={PRAYER_WATCH_YOUTUBE_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-5 text-sm font-semibold text-white">
            Join Prayer Watch on Pleros Live <ExternalLinkIcon className="size-4" />
          </a>

          <SogpDailyRequirements
            items={[
              {
                id: "prayer",
                title: "5:30 am Prayer Watch",
                description: "Confirm after joining live or completing the available replay.",
                complete: selectedDay.prayerWatchComplete,
                actionLabel: "I joined Prayer Watch",
                disabled: isFuture,
                pending: completionMutation.isPending,
                onToggle: () => completionMutation.mutate({ kind: "prayer", dayId: selectedDay.id, dateKey: selectedDay.dateKey, complete: !selectedDay.prayerWatchComplete }),
              },
              {
                id: "lesson",
                title: "Preparation lesson",
                description: "Watching or downloading does not complete the lesson automatically.",
                complete: selectedDay.lessonComplete,
                actionLabel: "Mark lesson complete",
                disabled: isFuture || !selectedDay.id || !selectedDay.lesson,
                pending: completionMutation.isPending,
                onToggle: () => completionMutation.mutate({ kind: "lesson", dayId: selectedDay.id, dateKey: selectedDay.dateKey, complete: !selectedDay.lessonComplete }),
              },
            ]}
          />
          {completionMutation.error ? (
            <p role="alert" className="text-sm text-red-700">{completionMutation.error.message}</p>
          ) : null}
        </main>

        <section
          data-pre-sogp-section="progress"
          className="grid gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-sky)] p-5 lg:col-start-2"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">Preparation progress</p>
          <p className="font-[var(--font-sen)] text-2xl font-semibold text-[var(--color-brand-blue)]">{completeDays} of 30 days complete</p>
        </section>
      </div>
    </section>
  );
}
