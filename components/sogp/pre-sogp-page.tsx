"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, BookOpenIcon, ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { PreSogpJourneyData } from "@/lib/db/queries/sogp-journey";
import { deriveSogpCalendarState } from "@/lib/sogp/calendar";
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
    queryFn: initialData ? async () => initialData : fetchPreparation,
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

  return (
    <section className="site-font-theme min-h-screen bg-[var(--color-surface)] pb-16">
      <nav aria-label="Pre-SOGP dashboard navigation" className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] shadow-sm">
        <div className="site-shell-page sogp-shell-page flex min-h-14 items-center justify-between gap-4">
          <Link href={preview ? "/preview/dashboard" : "/dashboard"} className="inline-flex min-h-10 items-center gap-2 rounded-full px-1 text-xs font-semibold text-white/88 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.96]">
            <ArrowLeftIcon className="size-4" strokeWidth={2} /> Dashboard
          </Link>
          <span className="font-[var(--font-sen)] text-xs font-semibold tracking-[0.12em] text-[var(--color-brand-lime)]">PRE-SOGP</span>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page grid gap-5 pb-6 pt-4 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start">
        <header
          data-pre-sogp-section="countdown"
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 lg:col-span-2"
        >
          <h1 className="font-[var(--font-sen)] text-xl font-semibold tracking-[-0.04em] text-[var(--color-text-strong)] md:text-2xl">
            Pre-SOGP Lessons
          </h1>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
            {data.countdown.label}
          </p>
        </header>

        {isPreparationUpcoming ? (
          <section
            data-pre-sogp-section="coming-soon"
            className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-6 md:p-8 lg:col-span-2"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">
              Starts {preparationStartLabel}
            </p>
            <h2 className="font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.035em] text-[var(--color-text-strong)]">
              Pre-SOGP is coming soon
            </h2>
            <p className="max-w-2xl text-sm leading-[1.6] text-[var(--color-text-muted)]">
              Video 1 opens at 12:00 am WAT. A new lesson will open each day
              until Video 30.
            </p>
          </section>
        ) : (
          <>
        <aside
          data-pre-sogp-section="calendar"
          className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-4 lg:sticky lg:top-[4.5rem]"
        >
          <SogpCalendar
            days={data.days}
            selectedDateKey={selectedDateKey}
            todayKey={data.todayKey}
            onSelect={setSelectedDateKey}
          />
        </aside>

        <main data-pre-sogp-section="daily-content" className="grid gap-5">
          <SogpLessonHeading
            eyebrow="Current day"
            title={`Day ${selectedDay.dayNumber}`}
            detail={selectedDay.dateKey}
          />

          {selectedDay.lesson ? (
            <SogpActivitySection
              title={`Preparation lesson ${selectedDay.dayNumber}`}
              icon={<BookOpenIcon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />}
            >
              <SogpLessonMedia
                title={selectedDay.lesson.title}
                url={selectedDay.lesson.url}
              />
              <h3 className="font-[var(--font-sen)] text-lg font-semibold leading-[1.25] tracking-[-0.025em] text-[var(--color-text-strong)]">
                {selectedDay.lesson.title}
              </h3>
              {selectedDay.lesson.description ? (
                <p className="text-sm leading-[1.55] text-[var(--color-text-muted)]">{selectedDay.lesson.description}</p>
              ) : null}
            </SogpActivitySection>
          ) : (
            <p className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-4 text-sm text-[var(--color-text-muted)]">
              {isFuture ? "This lesson opens on its date." : "Today’s lesson is being prepared."}
            </p>
          )}

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
                description: "Watching the video does not complete the lesson automatically.",
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
          {preview ? (
            <p className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-4 text-xs text-[var(--color-text-muted)]">Preview mode · Completion changes stay in this preview.</p>
          ) : (
            <SogpPushPanel />
          )}
        </main>

        <section
          data-pre-sogp-section="progress"
          className="grid gap-2 rounded-[var(--radius-md)] bg-[var(--color-brand-sky)] p-5 lg:col-start-2"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">Preparation progress</p>
          <p className="font-[var(--font-sen)] text-xl font-semibold text-[var(--color-brand-blue)] md:text-2xl">{completeDays} of 30 days complete</p>
        </section>
          </>
        )}
      </div>
    </section>
  );
}
