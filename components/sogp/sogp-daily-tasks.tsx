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
        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-medium leading-5",
        state === "complete" && "bg-[#e4ebfd] text-[#2331ae]",
        state === "current" && "bg-[#f7e4cd] text-[#92400e]",
        state === "pending" && "bg-[#eceef2] text-(--color-text-muted)",
      )}
    >
      {state === "complete" ? <CheckIcon className="size-3" strokeWidth={2.5} /> : null}
      {label}
    </span>
  );
}

export const SOGP_TASK_PRIMARY_BUTTON =
  "inline-flex h-[38px] max-w-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[11px] bg-[var(--color-community-blue,#2056d6)] px-3.5 text-[13.5px] font-medium text-white transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";
export const SOGP_TASK_SECONDARY_BUTTON =
  "inline-flex h-[38px] max-w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-[11px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-3.5 text-[13.5px] font-medium text-[var(--color-community-blue,#2056d6)] transition-colors hover:bg-[#f8f9fb] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50";

export function TaskCard({
  number,
  title,
  description,
  complete,
  locked,
  flat = false,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  complete: boolean;
  locked?: boolean;
  /** Rows inside one panel (the SOGP day) instead of separate cards. */
  flat?: boolean;
  children: ReactNode;
}) {
  return (
    <li
      className={cn(
        "relative grid min-w-0 gap-3",
        flat
          ? "px-3.5 py-3 [&+&]:before:absolute [&+&]:before:inset-x-3.5 [&+&]:before:top-0 [&+&]:before:h-px [&+&]:before:bg-[var(--color-line,#e7e9ec)] [&+&]:before:content-['']"
          : "rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white p-3.5",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center rounded-[8px] text-xs font-semibold",
            complete
              ? "bg-[var(--color-community-blue,#2056d6)] text-white"
              : "bg-[#f1f2f5] text-(--color-text-muted)",
          )}
        >
          {complete ? <CheckIcon className="size-3.5" strokeWidth={2.5} /> : number}
        </span>
        <div className="grid min-w-0 gap-1 pt-0.5">
          <h3 className="m-0 text-[13.5px] font-medium leading-[18px] text-(--color-text-strong)">{title}</h3>
          {description ? (
            <p className="text-xs leading-4 text-(--color-text-muted) [overflow-wrap:anywhere]">{description}</p>
          ) : null}
        </div>
        {locked ? <LockKeyholeIcon className="ml-auto size-4 shrink-0 text-[#a6abb2]" /> : null}
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
  const primaryButton = SOGP_TASK_PRIMARY_BUTTON;
  const secondaryButton = SOGP_TASK_SECONDARY_BUTTON;

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
          flat
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
            <p className="text-xs leading-4 text-(--color-text-muted)">{track.lockedReason}</p>
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
        flat
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
              <CheckIcon className="size-4 rounded-[4px] bg-[var(--color-community-blue,#2056d6)] p-0.5 text-white" strokeWidth={2.5} />
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
        flat
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
                <CheckIcon className="size-4 rounded-[4px] bg-[var(--color-community-blue,#2056d6)] p-0.5 text-white" strokeWidth={2.5} />
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
    <section className="grid min-w-0 gap-3">
      <div className="mx-px -mb-1 flex min-w-0 items-center justify-between gap-3">
        <h2 className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[15px] font-medium leading-[22px] text-(--color-text-strong)">{heading}</h2>
        <span className="shrink-0 text-[12.5px] text-(--color-text-muted)">
          {doneCount} of {tasks.length} done
        </span>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white">
        <p className="mx-3.5 mt-3 text-[12.5px] leading-[18px] text-(--color-text-muted)">
          Your {tasks.length} task{tasks.length === 1 ? "" : "s"} for {isToday ? "today" : weekdayDayLabel}
        </p>
        <ol className="m-0 grid list-none p-0">{tasks.map((task) => task.node)}</ol>
      </div>
    </section>
  );
}
