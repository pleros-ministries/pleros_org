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

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "there";
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
    <section className="site-font-theme min-h-screen bg-[var(--color-surface-muted)] pb-16 text-zinc-900">
      <header className="bg-[var(--color-brand-sky)] text-[var(--color-brand-blue)]">
        <div className="site-shell-page sogp-shell-page flex items-center justify-between gap-4 py-2.5">
          <Link
            href={preview ? "/preview/dashboard" : "/dashboard"}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-[var(--color-brand-blue)]/75 transition-colors duration-150 hover:text-[var(--color-brand-blue)] focus-visible:text-[var(--color-brand-blue)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand-blue)] active:scale-[0.98]"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Dashboard
          </Link>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-blue)]">
            SOGP
          </span>
        </div>
        <div className="site-shell-page sogp-shell-page grid gap-1 pb-4 pt-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]/75">
            {data.cohort.title}
          </p>
          <h1 className="ppc-heading text-2xl font-semibold tracking-[-0.02em] text-[var(--color-brand-blue)] md:text-3xl">
            Welcome, {firstName(data.enrollment.name)}
          </h1>
          {selectedDay.track ? (
            <p className="text-xs font-medium text-[var(--color-brand-blue)]/75">
              Level {selectedDay.track.curriculumLevel} · Track {selectedDay.track.levelPosition} of 6
            </p>
          ) : null}
        </div>
      </header>

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 pt-4 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[15.5rem_minmax(0,1fr)_15.5rem]">
        <aside data-sogp-section="calendar" className="lg:sticky lg:top-4">
          <SogpCourseSidebar
            data={data}
            selectedDateKey={selectedDateKey}
            onSelect={setSelectedDateKey}
          />
        </aside>

        <div data-sogp-section="daily-content" className="grid min-w-0 gap-4">
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
            <p role="alert" className="text-sm text-red-700">
              {mutation.error.message}
            </p>
          ) : null}
        </div>

        <div className="grid content-start gap-4 lg:col-start-2 xl:sticky xl:top-4 xl:col-start-auto">
          <SogpOtherDetails data={data} preview={preview} />
        </div>
      </div>
    </section>
  );
}
