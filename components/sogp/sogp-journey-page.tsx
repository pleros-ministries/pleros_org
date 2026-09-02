"use client";

import { useState } from "react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  BookOpenIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  CircleIcon,
  Clock3Icon,
  DownloadIcon,
  ExternalLinkIcon,
  FileQuestionIcon,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";
import { deriveSogpCalendarState } from "@/lib/sogp/calendar";
import { getSogpDayRequirements } from "@/lib/sogp/journey";
import { PRAYER_WATCH_YOUTUBE_URL } from "@/lib/prayer-watch";

import { SogpContextSidebar } from "./sogp-context-sidebar";
import { SogpCourseSidebar } from "./sogp-course-sidebar";
import { SogpActivitySection } from "./sogp-activity-section";
import { SogpLessonHeading } from "./sogp-lesson-heading";
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

  const primaryButton =
    "inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[var(--color-brand-blue)] px-3 text-xs font-medium text-white transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const secondaryButton =
    "inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <nav aria-label="SOGP dashboard navigation" className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] shadow-sm">
        <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-4">
          <Link href={preview ? "/preview/dashboard" : "/dashboard"} className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 transition-colors duration-150 hover:text-white focus-visible:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98]">
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Dashboard
          </Link>
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-lime)]">SOGP</span>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page grid gap-4 pb-6 pt-5 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[15.5rem_minmax(0,1fr)_15.5rem]">
        <header className="lg:col-span-2 xl:col-span-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h1 className="ppc-heading text-lg font-semibold text-zinc-900">Welcome, {firstName(data.enrollment.name)}</h1>
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-zinc-400">{data.cohort.title}</p>
          </div>
        </header>

        <aside
          data-sogp-section="calendar"
          className="lg:sticky lg:top-[3.75rem]"
        >
          <SogpCourseSidebar
            data={data}
            selectedDateKey={selectedDateKey}
            onSelect={setSelectedDateKey}
          />
        </aside>

        <main data-sogp-section="daily-content" className="grid min-w-0 gap-4">
          <SogpLessonHeading
            eyebrow={selectedDay.track ? "Current level" : "Current activity"}
            title={selectedDay.track ? `Level ${selectedDay.track.curriculumLevel}` : selectedDay.review ? "Review day" : "Daily formation"}
            detail={selectedDay.track ? `Track ${selectedDay.track.levelPosition} of 6` : selectedDay.dateKey}
          />

          <section aria-label="Today’s activities" className="grid gap-4">
            {selectedDay.track?.accessible ? (
              <SogpActivitySection
                title="Teaching"
                description={selectedDay.track.title}
                icon={<BookOpenIcon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />}
              >
                <p className="text-xs text-zinc-500">Listen at your pace. Audio playback is not tracked.</p>
                {selectedDay.track.audioUrl ? (
                  <>
                    <audio controls preload="metadata" src={selectedDay.track.audioUrl} className="w-full" />
                    <a href={selectedDay.track.audioUrl} download className={`${secondaryButton} w-fit`}>
                      <DownloadIcon className="size-3.5" strokeWidth={2} /> Download teaching
                    </a>
                  </>
                ) : <p className="text-xs text-zinc-500">The teaching audio is being prepared.</p>}
              </SogpActivitySection>
            ) : selectedDay.track ? (
              <SogpActivitySection
                title="Teaching and assessment"
                description="Complete the preceding level to unlock this activity."
                icon={<BookOpenIcon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />}
              >
                <h3 className="ppc-heading text-sm font-semibold text-zinc-900">This track is locked</h3>
                <p className="text-xs leading-[1.5] text-zinc-500">{selectedDay.track.lockedReason}</p>
              </SogpActivitySection>
            ) : null}

            <SogpActivitySection
              title="5:30 am Prayer Watch"
              description="Join live or use the replay, then confirm your attendance."
              icon={<Clock3Icon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />}
            >
              <div className="flex flex-wrap gap-2">
                <a href={PRAYER_WATCH_YOUTUBE_URL} target="_blank" rel="noreferrer" className={primaryButton}>Open Pleros Live <ExternalLinkIcon className="size-3.5" strokeWidth={2} /></a>
                <button type="button" disabled={isFuture || mutation.isPending} onClick={() => mutation.mutate({ kind: "prayer", dateKey: selectedDay.dateKey, complete: !selectedDay.prayerWatchComplete })} className={secondaryButton}>
                  {selectedDay.prayerWatchComplete ? <CheckCircle2Icon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} /> : <CircleIcon className="size-4 text-zinc-400" strokeWidth={2} />}
                  {selectedDay.prayerWatchComplete ? "Prayer Watch completed" : "Mark Prayer Watch complete"}
                </button>
              </div>
            </SogpActivitySection>

            {selectedDay.track?.accessible ? (
              <SogpActivitySection
                title="Assessment"
                description="Your assessment—not audio playback—completes this teaching."
                icon={<FileQuestionIcon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Link href={selectedDay.track.assessmentHref} onClick={(event) => { if (preview) event.preventDefault(); }} className={primaryButton}>{selectedDay.track.assessmentComplete ? "Review assessment" : "Start assessment"} <FileQuestionIcon className="size-3.5" strokeWidth={2} /></Link>
                  <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">{selectedDay.track.assessmentComplete ? <CheckCircle2Icon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} /> : <CircleIcon className="size-4 text-zinc-400" strokeWidth={2} />}{selectedDay.track.assessmentComplete ? "Complete" : "Not complete"}</span>
                </div>
              </SogpActivitySection>
            ) : null}

            {selectedDay.review ? (
              <SogpActivitySection
                title="Required live review"
                description="Join live when possible or complete the recording afterward."
                icon={<CalendarCheckIcon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />}
              >
                <div className="flex flex-wrap gap-2">
                  {(selectedDay.review.recordingUrl ?? selectedDay.review.liveUrl) ? <a href={selectedDay.review.recordingUrl ?? selectedDay.review.liveUrl ?? "#"} target="_blank" rel="noreferrer" className={primaryButton}>{selectedDay.review.recordingUrl ? "Watch recording" : "Join live review"} <ExternalLinkIcon className="size-3.5" strokeWidth={2} /></a> : null}
                  <button type="button" disabled={isFuture || mutation.isPending || (!selectedDay.review.liveUrl && !selectedDay.review.recordingUrl)} onClick={() => mutation.mutate({ kind: "review", dateKey: selectedDay.dateKey, reviewId: selectedDay.review!.id, source: reviewSource, complete: !selectedDay.review!.complete })} className={secondaryButton}>{selectedDay.review.complete ? <CheckCircle2Icon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} /> : <CircleIcon className="size-4 text-zinc-400" strokeWidth={2} />}{selectedDay.review.complete ? "Review completed" : "Mark review complete"}</button>
                </div>
              </SogpActivitySection>
            ) : null}
          </section>
          {mutation.error ? <p role="alert" className="text-sm text-red-700">{mutation.error.message}</p> : null}
        </main>

        <aside className="grid content-start gap-4 lg:col-start-2 xl:sticky xl:top-[3.75rem] xl:col-start-auto">
          <SogpContextSidebar data={data} />
          {preview ? <p className="rounded-sm border border-zinc-200 bg-white p-4 text-xs text-zinc-500">Preview mode · Progress changes stay in this preview.</p> : <SogpPushPanel />}
        </aside>
      </div>
    </section>
  );
}
