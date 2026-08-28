"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  CalendarCheckIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileQuestionIcon,
  RadioIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";
import { deriveSogpCalendarState } from "@/lib/sogp/calendar";
import { getSogpDayRequirements } from "@/lib/sogp/journey";
import { PRAYER_WATCH_YOUTUBE_URL } from "@/lib/prayer-watch";

import { SogpCalendar } from "./sogp-calendar";
import { SogpDailyRequirements } from "./sogp-daily-requirements";
import { SogpPushPanel } from "./sogp-push-panel";

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

export function SogpJourneyPage() {
  const { data } = useSuspenseQuery({ queryKey, queryFn: fetchJourney });
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

  const mutation = useMutation({
    mutationFn: saveDailyCompletion,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<SogpJourneyData>(queryKey);
      queryClient.setQueryData<SogpJourneyData>(queryKey, (current) => {
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
            const requirements =
              day.kind === "weekday"
                ? getSogpDayRequirements({
                    kind: "weekday",
                    prayerWatchComplete,
                    assessmentComplete: day.track?.assessmentComplete ?? false,
                  })
                : day.kind === "review"
                  ? getSogpDayRequirements({
                      kind: "review",
                      prayerWatchComplete,
                      reviewComplete: review?.complete ?? false,
                    })
                  : getSogpDayRequirements({ kind: "weekend", prayerWatchComplete });
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
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const reviewSource: "live" | "recording" = selectedDay.review?.recordingUrl
    ? "recording"
    : "live";

  return (
    <section className="site-font-theme min-h-screen bg-[var(--color-surface)] pb-16">
      <div className="site-shell-page sogp-shell-page grid gap-6 py-7 lg:grid-cols-[19rem_minmax(0,1fr)] lg:items-start">
        <header className="grid gap-1 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">
            {data.cohort.title}
          </p>
          <h1 className="font-[var(--font-sen)] text-3xl font-semibold tracking-[-0.055em] text-[var(--color-text-strong)]">
            Welcome, {firstName(data.enrollment.name)}
          </h1>
        </header>

        <aside
          data-sogp-section="calendar"
          className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-4 lg:sticky lg:top-5"
        >
          <SogpCalendar
            days={data.days}
            selectedDateKey={selectedDateKey}
            todayKey={data.todayKey}
            onSelect={setSelectedDateKey}
          />
        </aside>

        <main data-sogp-section="daily-content" className="grid gap-5">
          <div className="grid gap-1">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">
              {selectedDay.dateKey} · {selectedDay.kind === "weekday" ? "Teaching day" : selectedDay.kind === "review" ? "Review day" : "Weekend devotion"}
            </p>
            <h2 className="font-[var(--font-sen)] text-3xl font-semibold tracking-[-0.055em] text-[var(--color-text-strong)]">
              {selectedDay.track?.title ?? selectedDay.review?.title ?? "Prayer Watch and devotion"}
            </h2>
          </div>

          <a href={PRAYER_WATCH_YOUTUBE_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-5 text-sm font-semibold text-white">
            Join Prayer Watch on Pleros Live <ExternalLinkIcon className="size-4" />
          </a>

          {selectedDay.track ? (
            <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5">
              <div className="flex items-center gap-2">
                <RadioIcon className="size-5 text-[var(--color-brand-blue)]" />
                <h3 className="font-[var(--font-sen)] text-xl font-semibold text-[var(--color-text-strong)]">Teaching</h3>
              </div>
              {selectedDay.track.audioUrl ? (
                <>
                  <audio controls preload="metadata" src={selectedDay.track.audioUrl} className="w-full" />
                  <a href={selectedDay.track.audioUrl} download className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-[var(--color-brand-blue)] px-4 text-xs font-semibold text-[var(--color-brand-blue)]">
                    <DownloadIcon className="size-4" /> Download teaching
                  </a>
                </>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">The teaching audio is being prepared.</p>
              )}
              <Link href={selectedDay.track.assessmentHref} className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-[var(--color-brand-lime)] px-5 text-sm font-semibold text-[var(--color-brand-blue)]">
                <FileQuestionIcon className="size-4" /> Assessment
              </Link>
              {selectedDay.track.reviewState ? (
                <p className="text-xs text-[var(--color-text-muted)]">Written assessment: {selectedDay.track.reviewState.replaceAll("_", " ")}</p>
              ) : null}
            </section>
          ) : null}

          {selectedDay.review ? (
            <section className="grid gap-4 rounded-[var(--radius-md)] bg-[var(--color-brand-blue)] p-5 text-white">
              <div className="flex items-center gap-2">
                <CalendarCheckIcon className="size-5 text-[var(--color-brand-lime)]" />
                <h3 className="font-[var(--font-sen)] text-xl font-semibold">Required live review</h3>
              </div>
              <p className="text-sm text-white/78">Join live when possible. If you miss it, complete the recording afterward.</p>
              {(selectedDay.review.recordingUrl ?? selectedDay.review.liveUrl) ? (
                <a href={selectedDay.review.recordingUrl ?? selectedDay.review.liveUrl ?? "#"} target="_blank" rel="noreferrer" className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-[var(--color-brand-blue)]">
                  {selectedDay.review.recordingUrl ? "Watch review recording" : "Join live review"} <ExternalLinkIcon className="size-4" />
                </a>
              ) : null}
            </section>
          ) : null}

          <SogpDailyRequirements
            items={[
              {
                id: "prayer",
                title: "5:30 am Prayer Watch",
                description: "Prayer Watch is required every day during SOGP.",
                complete: selectedDay.prayerWatchComplete,
                actionLabel: "I joined Prayer Watch",
                disabled: isFuture,
                pending: mutation.isPending,
                onToggle: () => mutation.mutate({ kind: "prayer", dateKey: selectedDay.dateKey, complete: !selectedDay.prayerWatchComplete }),
              },
              ...(selectedDay.track
                ? [{
                    id: "assessment",
                    title: "Teaching assessment",
                    description: "The assessment, not audio playback, marks the teaching complete.",
                    complete: selectedDay.track.assessmentComplete,
                    actionLabel: "Open assessment",
                    disabled: true,
                    onToggle: () => undefined,
                  }]
                : []),
              ...(selectedDay.review
                ? [{
                    id: "review",
                    title: "Required live review",
                    description: selectedDay.review.recordingUrl ? "Complete using recording if you missed the live review." : "Confirm after joining the live review.",
                    complete: selectedDay.review.complete,
                    actionLabel: selectedDay.review.recordingUrl ? "Complete using recording" : "I joined the live review",
                    disabled: isFuture || (!selectedDay.review.liveUrl && !selectedDay.review.recordingUrl),
                    pending: mutation.isPending,
                    onToggle: () => mutation.mutate({ kind: "review", dateKey: selectedDay.dateKey, reviewId: selectedDay.review!.id, source: reviewSource, complete: !selectedDay.review!.complete }),
                  }]
                : []),
            ]}
          />
          {mutation.error ? <p role="alert" className="text-sm text-red-700">{mutation.error.message}</p> : null}

          <SogpPushPanel />

          <section className="grid gap-3 rounded-[var(--radius-md)] bg-[var(--color-brand-sky)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">SOGP progress</p>
            <div className="grid grid-cols-3 gap-3 text-[var(--color-brand-blue)]">
              <div><strong className="font-[var(--font-sen)] text-xl">{data.progress.coreCompleted}/{data.progress.coreTotal}</strong><p className="text-[0.65rem]">Core teachings</p></div>
              <div><strong className="font-[var(--font-sen)] text-xl">{data.progress.prayerPercent}%</strong><p className="text-[0.65rem]">Prayer Watch</p></div>
              <div><strong className="font-[var(--font-sen)] text-xl">{data.progress.reviewsCompleted}/{data.progress.reviewsTotal}</strong><p className="text-[0.65rem]">Reviews</p></div>
            </div>
          </section>

          <section className="grid gap-4 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">Extras</p>
              <h2 className="mt-1 font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.045em] text-[var(--color-text-strong)]">Additional teachings</h2>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">These four teachings are optional and excluded from SOGP completion.</p>
            </div>
            <div className="divide-y divide-[var(--color-line)]">
              {data.extras.map((extra) => (
                <article key={extra.id} className="grid gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center">
                  <h3 className="text-sm font-semibold text-[var(--color-text-strong)]">{extra.title}</h3>
                  {extra.audioUrl ? <a href={extra.audioUrl} download className="inline-flex min-h-9 w-fit items-center gap-2 rounded-full border border-[var(--color-line-strong)] px-3 text-xs font-semibold text-[var(--color-brand-blue)]"><DownloadIcon className="size-3.5" /> Download</a> : null}
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </section>
  );
}
