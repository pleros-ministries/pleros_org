"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";
import { deriveSogpCalendarState } from "@/lib/sogp/calendar";
import { getSogpDayRequirements } from "@/lib/sogp/journey";

import { SogpCourseSidebar } from "./sogp-course-sidebar";
import { SogpDailyTasks } from "./sogp-daily-tasks";
import { SogpOtherDetails } from "./sogp-other-details";
import styles from "./learning-tools.module.css";

const queryKey = ["sogp", "journey"] as const;

async function fetchJourney() {
  const response = await fetch("/api/sogp/journey", { credentials: "same-origin" });
  if (!response.ok) throw new Error("Your SOGP journey could not load.");
  return response.json() as Promise<SogpJourneyData>;
}

async function saveDailyCompletion(input: {
  kind: "prayer" | "review";
  dateKey: string;
  complete: boolean;
  reviewId?: number;
  source?: "live" | "recording";
}) {
  const response = await fetch(
    input.kind === "prayer"
      ? "/api/sogp/prayer-watch"
      : `/api/sogp/reviews/${input.reviewId}/completion`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        input.kind === "prayer"
          ? { dateKey: input.dateKey, complete: input.complete }
          : { complete: input.complete, source: input.source },
      ),
    },
  );
  const payload = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(payload.error ?? "Progress could not be saved.");
  return input;
}

export function SogpJourneyPage({
  initialData,
  preview = false,
}: {
  initialData?: SogpJourneyData;
  preview?: boolean;
} = {}) {
  const activeQueryKey = [...queryKey, preview ? "preview" : "live"] as const;
  const { data } = useSuspenseQuery({
    queryKey: activeQueryKey,
    queryFn: initialData ? async () => initialData : fetchJourney,
    initialData,
  });
  const searchParams = useSearchParams();
  const requestedDate = searchParams.get("date");
  const initialDate =
    data.days.find((day) => day.dateKey === requestedDate)?.dateKey ??
    data.days.find((day) => day.dateKey === data.todayKey)?.dateKey ??
    data.days[0]!.dateKey;
  const [selectedDateKey, setSelectedDateKey] = useState(initialDate);
  const queryClient = useQueryClient();
  const selectedDay = data.days.find((day) => day.dateKey === selectedDateKey) ?? data.days[0]!;
  const isFuture = selectedDay.dateKey > data.todayKey;
  const isToday = selectedDay.dateKey === data.todayKey;

  const mutation = useMutation({
    mutationFn: async (input: Parameters<typeof saveDailyCompletion>[0]) =>
      preview ? input : saveDailyCompletion(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: activeQueryKey });
      const previous = queryClient.getQueryData<SogpJourneyData>(activeQueryKey);
      queryClient.setQueryData<SogpJourneyData>(activeQueryKey, (current) => {
        if (!current) return current;
        return {
          ...current,
          days: current.days.map((day) => {
            if (day.dateKey !== input.dateKey) return day;
            const prayerWatchComplete =
              input.kind === "prayer" ? input.complete : day.prayerWatchComplete;
            const review =
              input.kind === "review" && day.review
                ? {
                    ...day.review,
                    complete: input.complete,
                    completionSource: input.complete ? input.source ?? "live" : null,
                  }
                : day.review;
            const requirements = getSogpDayRequirements({
              prayerWatchComplete,
              assessmentComplete: day.track ? day.track.assessmentComplete : undefined,
              reviewComplete: review ? review.complete : undefined,
            });
            return {
              ...day,
              prayerWatchComplete,
              review,
              state: deriveSogpCalendarState({
                dateKey: day.dateKey,
                todayKey: current.todayKey,
                requirements,
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

  const reviewSource: "live" | "recording" = selectedDay.review?.recordingUrl
    ? "recording"
    : "live";

  return (
    <section className={styles.page} data-wide="">
      <header className={styles.heading}>
        {/* The live dashboard shell carries navigation; the preview has no shell. */}
        {preview ? (
          <Link
            href="/preview/dashboard"
            className="mb-1 inline-flex min-h-8 w-fit items-center gap-1.5 text-[12.5px] font-medium text-[var(--color-community-blue,#2056d6)]"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Dashboard
          </Link>
        ) : null}
        <h1>Calendar and assessments</h1>
        <p className={styles.sub}>
          {data.cohort.title}
          {selectedDay.track
            ? ` · Level ${selectedDay.track.curriculumLevel}, track ${selectedDay.track.levelPosition} of 6`
            : ""}
        </p>
      </header>

      <aside data-sogp-section="calendar" className="min-w-0 lg:sticky lg:top-4">
        <SogpCourseSidebar
          data={data}
          selectedDateKey={selectedDateKey}
          onSelect={setSelectedDateKey}
        />
      </aside>

      <div className={styles.column}>
        <div data-sogp-section="daily-content" className={styles.column}>
          <SogpDailyTasks
            data={data}
            selectedDay={selectedDay}
            isToday={isToday}
            isFuture={isFuture}
            onTogglePrayer={() =>
              mutation.mutate({
                kind: "prayer",
                dateKey: selectedDay.dateKey,
                complete: !selectedDay.prayerWatchComplete,
              })
            }
            onToggleReview={() =>
              mutation.mutate({
                kind: "review",
                dateKey: selectedDay.dateKey,
                reviewId: selectedDay.review!.id,
                source: reviewSource,
                complete: !selectedDay.review!.complete,
              })
            }
            onSelectDate={setSelectedDateKey}
            prayerPending={mutation.isPending && mutation.variables?.kind === "prayer"}
            reviewPending={mutation.isPending && mutation.variables?.kind === "review"}
          />
          {mutation.error ? (
            <p role="alert" className={styles.error}>
              {mutation.error.message}
            </p>
          ) : null}
        </div>

        <SogpOtherDetails
          data={data}
          dayNumber={selectedDay.track?.dayNumber}
          preview={preview}
        />
      </div>
    </section>
  );
}
