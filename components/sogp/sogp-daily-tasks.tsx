"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  CheckIcon,
  ChevronRightIcon,
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

/** One task as one row (user request, 18 October: the day was cluttered). */
function TaskRow({
  title,
  meta,
  complete,
  toggle,
  href,
  action,
}: {
  title: string;
  meta: string;
  complete: boolean;
  /** Present when the learner marks the task done themselves. */
  toggle?: { label: string; disabled: boolean; onClick: () => void };
  href?: string;
  action?: ReactNode;
}) {
  const mark = (
    <span
      className={cn(
        "grid size-[22px] place-items-center rounded-full border transition-colors",
        complete
          ? "border-[var(--color-community-blue,#2056d6)] bg-[var(--color-community-blue,#2056d6)] text-white"
          : "border-[#c9ced6] bg-white text-transparent",
      )}
    >
      <CheckIcon className="size-3" strokeWidth={3} />
    </span>
  );
  const copy = (
    <span className="grid min-w-0 flex-1">
      <span className="truncate text-[13px] font-medium leading-[18px] text-(--color-text-strong)">{title}</span>
      <span className="truncate text-[11.5px] leading-4 text-(--color-text-muted)">{meta}</span>
    </span>
  );
  return (
    <li className="relative flex min-h-[58px] min-w-0 items-center gap-3 px-3.5 py-2.5 [&+&]:before:absolute [&+&]:before:inset-x-3.5 [&+&]:before:top-0 [&+&]:before:h-px [&+&]:before:bg-[var(--color-line,#e7e9ec)] [&+&]:before:content-['']">
      {toggle ? (
        <button
          type="button"
          aria-pressed={complete}
          aria-label={toggle.label}
          disabled={toggle.disabled}
          onClick={toggle.onClick}
          className="-m-2 grid shrink-0 cursor-pointer place-items-center p-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {mark}
        </button>
      ) : (
        <span className="shrink-0">{mark}</span>
      )}
      {href ? (
        <Link href={href} className="flex min-w-0 flex-1 items-center gap-2">
          {copy}
          {action ? null : <ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" />}
        </Link>
      ) : (
        copy
      )}
      {action}
    </li>
  );
}

const rowAction =
  "inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-[9px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-2.5 text-[12.5px] font-medium text-[var(--color-community-blue,#2056d6)] transition-colors hover:bg-[#f8f9fb] active:scale-[0.98]";

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
  const tasks: Array<{ key: string; complete: boolean; node: ReactNode }> = [];

  if (data.path === "podcast") {
    // The podcast path keeps its own pace (Pastor, 20 October): its day is the next podcast day, not this date's track.
    tasks.push({
      key: "podcast",
      complete: true,
      node: (
        <TaskRow
          key="podcast"
          title="Your podcast day"
          meta="At your own pace, from your podcast plan"
          complete={false}
          href="/dashboard/sogp/listen"
          action={<Link href="/dashboard/sogp/listen" className={rowAction}>Listen</Link>}
        />
      ),
    });
  } else if (track) {
    const response = writtenResponseCopy(track.writtenResponseStatus);
    // `accessible` only means the track is unlocked, not that it was opened;
    // passing the quiz is the closest real signal of engagement.
    const teachingComplete = track.accessible && track.assessmentComplete;
    const lessonHref = `/dashboard/sogp/course/day/${track.dayNumber}`;
    const nextHref = !track.quizPassed ? `${lessonHref}/quiz` : `${lessonHref}/response`;
    const nextLabel = !track.quizPassed ? "Take quiz" : response.button;
    const meta = !track.accessible
      ? track.lockedReason ?? "Locked"
      : teachingComplete
        ? `${track.title} · done`
        : !track.quizPassed
          ? `${track.title} · quiz to do`
          : `${track.title} · response ${response.label.toLowerCase()}`;
    tasks.push({
      key: "teaching",
      complete: teachingComplete,
      node: (
        <TaskRow
          key="teaching"
          title="Teaching"
          meta={meta}
          complete={teachingComplete}
          href={track.accessible ? lessonHref : undefined}
          action={
            !track.accessible ? (
              <LockKeyholeIcon className="size-4 shrink-0 text-[#a6abb2]" />
            ) : !teachingComplete ? (
              <Link href={nextHref} className={rowAction}>
                {nextLabel}
              </Link>
            ) : undefined
          }
        />
      ),
    });
  }

  tasks.push({
    key: "prayer",
    complete: selectedDay.prayerWatchComplete,
    node: (
      <TaskRow
        key="prayer"
        title="5:30 am Prayer Watch"
        meta="Join live or watch the replay"
        complete={selectedDay.prayerWatchComplete}
        toggle={{
          label: selectedDay.prayerWatchComplete ? "Mark Prayer Watch not done" : "Mark Prayer Watch done",
          disabled: isFuture || prayerPending,
          onClick: onTogglePrayer,
        }}
        action={
          <a href={PRAYER_WATCH_YOUTUBE_URL} target="_blank" rel="noreferrer" className={rowAction}>
            Watch <ExternalLinkIcon className="size-3.5" strokeWidth={2} />
          </a>
        }
      />
    ),
  });

  const nextReviewDay = data.days.find(
    (day) => day.review && !day.review.complete && day.dateKey >= data.todayKey,
  );
  // A day only carries a review requirement when `selectedDay.review` is set
  // (see lib/db/queries/sogp-journey.ts); other days have nothing to do here.
  const review = selectedDay.review;
  const reviewComplete = review ? review.complete : true;
  const reviewLink = review ? review.recordingUrl ?? review.liveUrl : null;
  tasks.push({
    key: "review",
    complete: reviewComplete,
    node: (
      <TaskRow
        key="review"
        title={review ? review.title : "Review"}
        meta={
          review
            ? review.recordingUrl ? "Watch the recording, then mark it done" : "Join live, then mark it done"
            : nextReviewDay?.review
              ? `Next up: ${nextReviewDay.review.title}`
              : "All scheduled reviews are complete"
        }
        complete={reviewComplete}
        toggle={
          review
            ? {
                label: review.complete ? "Mark review not done" : "Mark review done",
                disabled: isFuture || reviewPending || !reviewLink,
                onClick: onToggleReview,
              }
            : undefined
        }
        action={
          reviewLink ? (
            <a href={reviewLink} target="_blank" rel="noreferrer" className={rowAction}>
              {review?.recordingUrl ? "Watch" : "Join"} <ExternalLinkIcon className="size-3.5" strokeWidth={2} />
            </a>
          ) : !review && nextReviewDay ? (
            <button type="button" onClick={() => onSelectDate(nextReviewDay.dateKey)} className={cn(rowAction, "cursor-pointer")}>
              View
            </button>
          ) : undefined
        }
      />
    ),
  });

  // The podcast row has no date to finish by, so it never counts towards the day.
  const counted = tasks.filter((task) => task.key !== "podcast");
  const doneCount = counted.filter((task) => task.complete).length;
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
          {doneCount} of {counted.length} done
        </span>
      </div>
      <div className="overflow-hidden rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white">
        <ol className="m-0 grid list-none p-0">{tasks.map((task) => task.node)}</ol>
      </div>
    </section>
  );
}
