"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  CheckIcon,
  ExternalLinkIcon,
  LockKeyholeIcon,
} from "lucide-react";

import type { SogpJourneyData } from "@/lib/db/queries/sogp-journey";
import { PRAYER_WATCH_YOUTUBE_URL } from "@/lib/prayer-watch";
import { cn } from "@/lib/utils";

type SogpDay = SogpJourneyData["days"][number];

function writtenResponseCopy(status: string | null) {
  switch (status) {
    case "draft":
      return { button: "Continue response", label: "Draft saved", complete: false };
    case "submitted":
      return { button: "View response", label: "Submitted for review", complete: true };
    case "approved":
      return { button: "View response", label: "Approved", complete: true };
    case "needs_revision":
      return { button: "Revise response", label: "Needs revision", complete: false };
    default:
      return { button: "Write response", label: "Not started", complete: false };
  }
}

function TaskPill({
  label,
  state,
}: {
  label: string;
  state: "complete" | "current" | "pending";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold",
        state === "complete" &&
          "border-transparent bg-[var(--color-brand-sky-soft)] text-[var(--color-brand-blue)]",
        state === "current" &&
          "border-[var(--color-brand-blue)] text-[var(--color-brand-blue)]",
        state === "pending" && "border-zinc-200 text-zinc-400",
      )}
    >
      {state === "complete" ? <CheckIcon className="size-3.5" strokeWidth={2.5} /> : null}
      {label}
    </span>
  );
}

function TaskCard({
  number,
  title,
  description,
  complete,
  locked,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  complete: boolean;
  locked?: boolean;
  children: ReactNode;
}) {
  return (
    <li className="grid gap-3 rounded-[var(--radius-md)] border border-zinc-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold",
            complete
              ? "bg-[var(--color-brand-lime)] text-[var(--color-brand-blue)]"
              : "bg-[var(--color-brand-blue)] text-white",
          )}
        >
          {complete ? <CheckIcon className="size-3.5" strokeWidth={2.5} /> : number}
        </span>
        <div className="grid min-w-0 gap-1 pt-0.5">
          <h3 className="ppc-heading text-base font-semibold text-zinc-900">{title}</h3>
          {description ? (
            <p className="text-xs leading-[1.5] text-zinc-500">{description}</p>
          ) : null}
        </div>
        {locked ? <LockKeyholeIcon className="ml-auto size-4 shrink-0 text-zinc-300" /> : null}
      </div>
      {children}
    </li>
  );
}

export function SogpDailyTasks({
  data,
  selectedDay,
  isToday,
  isFuture,
  onTogglePrayer,
  onToggleReview,
  onSelectDate,
  prayerPending,
  reviewPending,
}: {
  data: SogpJourneyData;
  selectedDay: SogpDay;
  isToday: boolean;
  isFuture: boolean;
  onTogglePrayer: () => void;
  onToggleReview: () => void;
  onSelectDate: (dateKey: string) => void;
  prayerPending: boolean;
  reviewPending: boolean;
}) {
  const track = selectedDay.track;
  const primaryButton =
    "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-[var(--color-brand-blue)] px-4 text-xs font-semibold text-white transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
  const secondaryButton =
    "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

  const teachingTasks: Array<{ key: string; complete: boolean; node: ReactNode }> = [];

  if (track) {
    const response = writtenResponseCopy(track.writtenResponseStatus);
    // `accessible` only means the track is unlocked — it isn't evidence the
    // lesson was ever opened, so the pill can't claim "complete" from that
    // alone. Passing the quiz is the closest real signal of engagement.
    const teachingComplete = track.accessible && track.assessmentComplete;
    const lessonState: "complete" | "current" | "pending" = track.quizPassed
      ? "complete"
      : track.accessible
        ? "current"
        : "pending";
    const quizState: "complete" | "current" | "pending" = track.quizPassed
      ? "complete"
      : track.accessible
        ? "current"
        : "pending";
    const responseState: "complete" | "current" | "pending" = response.complete
      ? "complete"
      : track.quizPassed
        ? "current"
        : "pending";

    const lessonHref = `/dashboard/sogp/course/day/${track.dayNumber}`;
    const nextActionHref = !track.quizPassed
      ? `/dashboard/sogp/course/day/${track.dayNumber}/quiz`
      : `/dashboard/sogp/course/day/${track.dayNumber}/response`;
    const nextActionLabel = !track.quizPassed ? "Take quiz" : response.button;

    teachingTasks.push({
      key: "teaching",
      complete: teachingComplete,
      node: (
        <TaskCard
          key="teaching"
          number={1}
          title="Teaching"
          description={track.title}
          complete={teachingComplete}
          locked={!track.accessible}
        >
          <div className="flex flex-wrap gap-2">
            <TaskPill label="Lesson" state={lessonState} />
            <TaskPill label="Quiz" state={quizState} />
            <TaskPill label="Response" state={responseState} />
          </div>
          {track.accessible ? (
            <div className="flex flex-wrap gap-2">
              <Link href={lessonHref} className={secondaryButton}>
                {teachingComplete ? "Review lesson" : "Open lesson"}
              </Link>
              {!teachingComplete ? (
                <Link href={nextActionHref} className={primaryButton}>
                  {nextActionLabel}
                </Link>
              ) : null}
            </div>
          ) : (
            <p className="text-xs leading-[1.5] text-zinc-500">{track.lockedReason}</p>
          )}
        </TaskCard>
      ),
    });
  }

  const prayerTask = {
    key: "prayer",
    complete: selectedDay.prayerWatchComplete,
    node: (
      <TaskCard
        key="prayer"
        number={teachingTasks.length + 1}
        title="5:30 am Prayer Watch"
        description="Join live or watch the replay, then mark it done."
        complete={selectedDay.prayerWatchComplete}
      >
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={PRAYER_WATCH_YOUTUBE_URL}
            target="_blank"
            rel="noreferrer"
            className={primaryButton}
          >
            Open Pleros Live <ExternalLinkIcon className="size-3.5" strokeWidth={2} />
          </a>
          <button
            type="button"
            disabled={isFuture || prayerPending}
            onClick={onTogglePrayer}
            aria-pressed={selectedDay.prayerWatchComplete}
            className={secondaryButton}
          >
            {selectedDay.prayerWatchComplete ? (
              <CheckIcon className="size-4 rounded-[4px] bg-[var(--color-brand-blue)] p-0.5 text-white" strokeWidth={2.5} />
            ) : (
              <span className="grid size-4 place-items-center rounded-[4px] border border-zinc-300" />
            )}
            Done
          </button>
        </div>
      </TaskCard>
    ),
  };

  const nextReviewDay = data.days.find(
    (day) => day.review && !day.review.complete && day.dateKey >= data.todayKey,
  );
  const nextReview = nextReviewDay?.review;
  // A day only carries a review requirement when `selectedDay.review` is set
  // (see lib/db/queries/sogp-journey.ts). A day without one — including the
  // pre-policy-change days grandfathered in as optional — has nothing to do
  // for Review, regardless of whether a later day still has one outstanding.
  const reviewComplete = selectedDay.review ? selectedDay.review.complete : true;

  const reviewTask = {
    key: "review",
    complete: reviewComplete,
    node: (
      <TaskCard
        key="review"
        number={teachingTasks.length + 2}
        title="Review"
        description={
          selectedDay.review
            ? selectedDay.review.title
            : nextReview
              ? `Next up: ${nextReview.title}`
              : "All scheduled reviews are complete."
        }
        complete={reviewComplete}
      >
        {selectedDay.review ? (
          <div className="flex flex-wrap gap-2">
            {(selectedDay.review.recordingUrl ?? selectedDay.review.liveUrl) ? (
              <a
                href={selectedDay.review.recordingUrl ?? selectedDay.review.liveUrl ?? "#"}
                target="_blank"
                rel="noreferrer"
                className={primaryButton}
              >
                {selectedDay.review.recordingUrl ? "Watch recording" : "Join live review"}{" "}
                <ExternalLinkIcon className="size-3.5" strokeWidth={2} />
              </a>
            ) : null}
            <button
              type="button"
              disabled={
                isFuture ||
                reviewPending ||
                (!selectedDay.review.liveUrl && !selectedDay.review.recordingUrl)
              }
              onClick={onToggleReview}
              aria-pressed={selectedDay.review.complete}
              className={secondaryButton}
            >
              {selectedDay.review.complete ? (
                <CheckIcon className="size-4 rounded-[4px] bg-[var(--color-brand-blue)] p-0.5 text-white" strokeWidth={2.5} />
              ) : (
                <span className="grid size-4 place-items-center rounded-[4px] border border-zinc-300" />
              )}
              Done
            </button>
          </div>
        ) : nextReviewDay ? (
          <button
            type="button"
            onClick={() => onSelectDate(nextReviewDay.dateKey)}
            className={cn(primaryButton, "w-fit")}
          >
            View review
          </button>
        ) : null}
      </TaskCard>
    ),
  };

  const tasks = [...teachingTasks, prayerTask, reviewTask];
  const doneCount = tasks.filter((task) => task.complete).length;
  const weekdayDayLabel = new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${selectedDay.dateKey}T00:00:00.000Z`));
  const heading = isToday ? `Today, ${weekdayDayLabel}` : weekdayDayLabel;

  return (
    <section className="grid gap-4 rounded-[var(--radius-md)] border border-zinc-200 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="ppc-heading text-lg font-semibold text-zinc-900">{heading}</h2>
        <span className="text-xs font-semibold text-[var(--color-brand-blue)]">
          {doneCount} of {tasks.length} done
        </span>
      </div>
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-zinc-400">
        Your {tasks.length} task{tasks.length === 1 ? "" : "s"} for {isToday ? "today" : weekdayDayLabel}
      </p>
      <ol className="grid gap-3">{tasks.map((task) => task.node)}</ol>
    </section>
  );
}
