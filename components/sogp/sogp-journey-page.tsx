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

  return (
    <section className="site-font-theme min-h-screen bg-[var(--color-surface)] pb-16">
      <div className="site-shell-page sogp-shell-page grid gap-5 py-6 lg:grid-cols-[16.5rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[16.5rem_minmax(0,1fr)_16.5rem]">
        <header className="grid gap-3 lg:col-span-2 xl:col-span-3">
          <Link href={preview ? "/preview/dashboard" : "/dashboard"} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full px-1 text-xs font-semibold text-[var(--color-text-muted)] transition-colors duration-150 hover:text-[var(--color-brand-blue)] active:scale-[0.96]">
            <ArrowLeftIcon className="size-4" strokeWidth={2} /> Dashboard
          </Link>
          <div className="grid gap-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-brand-blue)]">{data.cohort.title}</p>
            <h1 className="font-[var(--font-sen)] text-2xl font-semibold tracking-[-0.045em] text-[var(--color-text-strong)] md:text-3xl">Welcome, {firstName(data.enrollment.name)}</h1>
          </div>
        </header>

        <aside
          data-sogp-section="calendar"
          className="lg:sticky lg:top-5"
        >
          <SogpCourseSidebar
            data={data}
            selectedDateKey={selectedDateKey}
            onSelect={setSelectedDateKey}
          />
        </aside>

        <main data-sogp-section="daily-content" className="grid min-w-0 gap-5">
          <section aria-label="SOGP levels" className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {data.levels.map((level) => (
              <div
                key={level.level}
                className={`grid min-h-24 content-between gap-2 rounded-[var(--radius-md)] border p-3 ${level.status === "complete" ? "border-[var(--color-brand-lime)] bg-[var(--color-brand-lime)]/15" : level.status === "locked" ? "border-[var(--color-line)] bg-white opacity-60" : "border-[var(--color-brand-blue)] bg-[var(--color-brand-sky)]"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <strong className="font-[var(--font-sen)] text-sm text-[var(--color-text-strong)]">Level {level.level}</strong>
                  <span className="text-[0.62rem] font-semibold uppercase tracking-[0.08em] text-[var(--color-brand-blue)]">{level.status.replaceAll("_", " ")}</span>
                </div>
                <p className="text-[0.68rem] leading-[1.35] text-[var(--color-text-muted)]">{level.title}</p>
                <span className="text-xs font-semibold text-[var(--color-brand-blue)]">{level.completed}/{level.total}</span>
              </div>
            ))}
          </section>

          <SogpLessonHeading
            metadata={`${selectedDay.track ? `Level ${selectedDay.track.curriculumLevel} · Track ${selectedDay.track.levelPosition}` : selectedDay.kind === "review" ? "Required review" : "Daily formation"} · ${selectedDay.dateKey}`}
            title={selectedDay.track?.title ?? selectedDay.review?.title ?? "Prayer Watch and devotion"}
          />

          <section aria-label="Today’s activities" className="grid gap-5 md:gap-6">
            {selectedDay.track?.accessible ? (
              <SogpActivitySection
                title="Teaching"
                description="Listen at your pace. Audio playback is not tracked."
                icon={<BookOpenIcon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />}
              >
                {selectedDay.track.audioUrl ? (
                  <div className="grid gap-3">
                    <audio controls preload="metadata" src={selectedDay.track.audioUrl} className="w-full" />
                    <a href={selectedDay.track.audioUrl} download className="inline-flex min-h-10 w-fit items-center gap-2 rounded-full border border-[var(--color-brand-blue)] px-4 text-xs font-semibold text-[var(--color-brand-blue)] active:scale-[0.96]">
                      <DownloadIcon className="size-4" strokeWidth={2} /> Download teaching
                    </a>
                  </div>
                ) : <p className="text-sm text-[var(--color-text-muted)]">The teaching audio is being prepared.</p>}
              </SogpActivitySection>
            ) : selectedDay.track ? (
              <SogpActivitySection
                title="Teaching and assessment"
                description="Complete the preceding level to unlock this activity."
                icon={<BookOpenIcon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />}
              >
                <h3 className="font-[var(--font-sen)] text-lg font-semibold text-[var(--color-text-strong)]">This track is locked</h3>
                <p className="text-sm text-[var(--color-text-muted)]">{selectedDay.track.lockedReason}</p>
              </SogpActivitySection>
            ) : null}

            <SogpActivitySection
              title="5:30 am Prayer Watch"
              description="Join live or use the replay, then confirm your attendance."
              icon={<Clock3Icon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} />}
            >
              <div className="flex flex-wrap gap-2">
                <a href={PRAYER_WATCH_YOUTUBE_URL} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white active:scale-[0.96]">Open Pleros Live <ExternalLinkIcon className="size-3.5" strokeWidth={2} /></a>
                <button type="button" disabled={isFuture || mutation.isPending} onClick={() => mutation.mutate({ kind: "prayer", dateKey: selectedDay.dateKey, complete: !selectedDay.prayerWatchComplete })} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-brand-blue)] bg-white px-4 text-xs font-semibold text-[var(--color-brand-blue)] active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50">
                  {selectedDay.prayerWatchComplete ? <CheckCircle2Icon className="size-4" strokeWidth={2} /> : <CircleIcon className="size-4" strokeWidth={2} />}
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
                  <Link href={selectedDay.track.assessmentHref} onClick={(event) => { if (preview) event.preventDefault(); }} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white active:scale-[0.96]">{selectedDay.track.assessmentComplete ? "Review assessment" : "Start assessment"} <FileQuestionIcon className="size-3.5" strokeWidth={2} /></Link>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">{selectedDay.track.assessmentComplete ? <CheckCircle2Icon className="size-4 text-[var(--color-brand-blue)]" strokeWidth={2} /> : <CircleIcon className="size-4" strokeWidth={2} />}{selectedDay.track.assessmentComplete ? "Complete" : "Not complete"}</span>
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
                  {(selectedDay.review.recordingUrl ?? selectedDay.review.liveUrl) ? <a href={selectedDay.review.recordingUrl ?? selectedDay.review.liveUrl ?? "#"} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white active:scale-[0.96]">{selectedDay.review.recordingUrl ? "Watch recording" : "Join live review"} <ExternalLinkIcon className="size-3.5" strokeWidth={2} /></a> : null}
                  <button type="button" disabled={isFuture || mutation.isPending || (!selectedDay.review.liveUrl && !selectedDay.review.recordingUrl)} onClick={() => mutation.mutate({ kind: "review", dateKey: selectedDay.dateKey, reviewId: selectedDay.review!.id, source: reviewSource, complete: !selectedDay.review!.complete })} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--color-brand-blue)] px-4 text-xs font-semibold text-[var(--color-brand-blue)] active:scale-[0.96] disabled:opacity-50">{selectedDay.review.complete ? <CheckCircle2Icon className="size-4" strokeWidth={2} /> : <CircleIcon className="size-4" strokeWidth={2} />}{selectedDay.review.complete ? "Review completed" : "Mark review complete"}</button>
                </div>
              </SogpActivitySection>
            ) : null}
          </section>
          {mutation.error ? <p role="alert" className="text-sm text-red-700">{mutation.error.message}</p> : null}
        </main>

        <aside className="grid content-start gap-3 lg:col-start-2 xl:sticky xl:top-5 xl:col-start-auto">
          <SogpContextSidebar data={data} />
          {preview ? <p className="rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-4 text-xs text-[var(--color-text-muted)]">Preview mode · Progress changes stay in this preview.</p> : <SogpPushPanel />}
        </aside>
      </div>
    </section>
  );
}
