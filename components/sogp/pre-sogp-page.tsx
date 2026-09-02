"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, BookOpenIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { PreSogpJourneyData } from "@/lib/db/queries/sogp-journey";
import {
  deriveSogpCalendarState,
  PRE_SOGP_PREPARATION_DAYS,
} from "@/lib/sogp/calendar";
import { getPreparationRequirements } from "@/lib/sogp/journey";
import { PRAYER_WATCH_YOUTUBE_URL } from "@/lib/prayer-watch";

import { SogpCalendar } from "./sogp-calendar";
import { SogpActivitySection } from "./sogp-activity-section";
import { SogpDailyRequirements } from "./sogp-daily-requirements";
import { SogpLessonHeading } from "./sogp-lesson-heading";
import { SogpLessonMedia } from "./sogp-lesson-media";
import { SogpPushPanel } from "./sogp-push-panel";

const queryKey = ["sogp", "preparation"] as const;

function formatPreparationStartDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year!, month! - 1, day)));
}

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

export function PreSogpPage({
  initialData,
  preview = false,
}: {
  initialData?: PreSogpJourneyData;
  preview?: boolean;
} = {}) {
  const activeQueryKey = [...queryKey, preview ? "preview" : "live"] as const;
  const { data } = useSuspenseQuery({
    queryKey: activeQueryKey,
    // Preview holds its fixture static; live seeds from server-provided
    // initialData (so nothing fetches during SSR) but still refetches via the
    // API on the client.
    queryFn: preview ? async () => initialData! : fetchPreparation,
    initialData,
  });
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
  const preparationStartDateKey = data.days[0]?.dateKey ?? data.todayKey;
  const isPreparationUpcoming = preparationStartDateKey > data.todayKey;
  const preparationStartLabel = formatPreparationStartDate(
    preparationStartDateKey,
  );

  const completionMutation = useMutation({
    mutationFn: async (input: Parameters<typeof saveCompletion>[0]) =>
      preview ? input : saveCompletion(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: activeQueryKey });
      const previous = queryClient.getQueryData<PreSogpJourneyData>(activeQueryKey);
      queryClient.setQueryData<PreSogpJourneyData>(activeQueryKey, (current) => {
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
      if (context?.previous) queryClient.setQueryData(activeQueryKey, context.previous);
    },
    onSettled: () =>
      preview
        ? Promise.resolve()
        : queryClient.invalidateQueries({ queryKey: activeQueryKey }),
  });

  const completeDays = data.days.filter((day) => day.state === "complete").length;
  const isFuture = selectedDay.dateKey > data.todayKey;

  const preparationPercent = Math.round(
    (completeDays / PRE_SOGP_PREPARATION_DAYS) * 100,
  );

  return (
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <nav aria-label="Pre-SOGP dashboard navigation" className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] shadow-sm">
        <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-4">
          <Link href={preview ? "/preview/dashboard" : "/dashboard"} className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]">
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Dashboard
          </Link>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 pt-5 lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start">
        <header
          data-pre-sogp-section="countdown"
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 lg:col-span-2"
        >
          <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
            Pre-SOGP Lessons
          </h1>
        </header>

        {isPreparationUpcoming ? (
          <section
            data-pre-sogp-section="coming-soon"
            className="rounded-sm border border-zinc-200 bg-white lg:col-span-2"
          >
            <div className="border-b border-zinc-100 px-4 py-3">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-zinc-400">
                Starts {preparationStartLabel}
              </p>
              <h2 className="ppc-heading mt-1 text-base font-semibold text-zinc-900">
                Pre-SOGP is coming soon
              </h2>
            </div>
            <p className="max-w-2xl p-4 text-xs leading-[1.6] text-zinc-500">
              Video 1 opens at 12:00 am WAT. A new lesson will open each day
              until Video {PRE_SOGP_PREPARATION_DAYS}.
            </p>
          </section>
        ) : (
          <>
        <aside
          data-pre-sogp-section="calendar"
          className="rounded-sm border border-zinc-200 bg-white p-3 lg:sticky lg:top-[3.75rem]"
        >
          <SogpCalendar
            days={data.days}
            selectedDateKey={selectedDateKey}
            todayKey={data.todayKey}
            onSelect={setSelectedDateKey}
          />
        </aside>

        <main data-pre-sogp-section="daily-content" className="grid gap-4">
          <SogpLessonHeading
            eyebrow="Current day"
            title={`Day ${selectedDay.dayNumber}/${PRE_SOGP_PREPARATION_DAYS}`}
          />

          <SogpDailyRequirements
            items={[
              {
                id: "prayer",
                title: "5:30 am Prayer Watch",
                description: "Confirm after joining live or completing the available replay.",
                complete: selectedDay.prayerWatchComplete,
                actionLabel: "I joined",
                disabled: isFuture,
                pending: completionMutation.isPending,
                onToggle: () => completionMutation.mutate({ kind: "prayer", dayId: selectedDay.id, dateKey: selectedDay.dateKey, complete: !selectedDay.prayerWatchComplete }),
                link: { href: PRAYER_WATCH_YOUTUBE_URL, label: "Join on Pleros Live" },
              },
              {
                id: "lesson",
                title: "Preparation lesson",
                description: "Mark the lesson as watched — watching the video does not complete it automatically.",
                complete: selectedDay.lessonComplete,
                actionLabel: "I've watched lesson",
                disabled: isFuture || !selectedDay.id || !selectedDay.lesson,
                pending: completionMutation.isPending,
                onToggle: () => completionMutation.mutate({ kind: "lesson", dayId: selectedDay.id, dateKey: selectedDay.dateKey, complete: !selectedDay.lessonComplete }),
                link: selectedDay.lesson ? { href: "#lesson-video", label: "Watch video" } : undefined,
              },
            ]}
          />
          {completionMutation.error ? (
            <p role="alert" className="text-sm text-red-700">{completionMutation.error.message}</p>
          ) : null}

          {selectedDay.lesson ? (
            <SogpActivitySection
              id="lesson-video"
              title={`Preparation lesson ${selectedDay.dayNumber}`}
              icon={<BookOpenIcon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />}
            >
              <SogpLessonMedia
                title={selectedDay.lesson.title}
                url={selectedDay.lesson.url}
              />
              <h3 className="ppc-heading text-sm font-semibold leading-[1.3] text-zinc-900">
                {selectedDay.lesson.title}
              </h3>
            </SogpActivitySection>
          ) : (
            <p className="rounded-sm border border-zinc-200 bg-white p-4 text-xs text-zinc-500">
              {isFuture ? "This lesson opens on its date." : "Today’s lesson is being prepared."}
            </p>
          )}

          {preview ? (
            <p className="rounded-sm border border-zinc-200 bg-white p-4 text-xs text-zinc-500">Preview mode · Completion changes stay in this preview.</p>
          ) : (
            <SogpPushPanel />
          )}
        </main>

        <section
          data-pre-sogp-section="progress"
          className="rounded-sm border border-zinc-200 bg-white lg:col-start-2"
        >
          <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3">
            <h2 className="ppc-heading text-sm font-semibold text-zinc-900">Preparation progress</h2>
            <span className="ppc-heading text-sm font-semibold text-[var(--color-brand-blue)]">{completeDays} of {PRE_SOGP_PREPARATION_DAYS} days</span>
          </div>
          <div className="p-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-[var(--color-brand-blue)]" style={{ width: `${preparationPercent}%` }} />
            </div>
          </div>
        </section>
          </>
        )}
      </div>
    </section>
  );
}
