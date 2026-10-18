import { RouteIcon } from "lucide-react";

import type {
  PodcastJourneySummary,
  ResolvedPodcastJourney,
} from "@/lib/podcast-journey";

import styles from "./podcast.module.css";

function progressPercent(completed: number, total: number) {
  return total ? Math.round((completed / total) * 100) : 0;
}

/** Which journey the listener is on, how far through it they are, and the way to change it. */
export function PodcastJourneyCard({
  journey,
  summary,
  onChangeJourney,
}: {
  journey: ResolvedPodcastJourney;
  summary: PodcastJourneySummary | null;
  onChangeJourney: () => void;
}) {
  const finished = summary?.finished ?? false;

  return (
    <section className={styles.panel} aria-label="Your journey">
      <div className={styles.row}>
        <span className={styles.chip} data-tone="sky" aria-hidden="true">
          <RouteIcon className="size-4" strokeWidth={2} />
        </span>
        <span className={styles.rowCopy}>
          <span className="flex min-w-0 items-center gap-2">
            <span className={styles.rowTitle}>{journey.title}</span>
            {journey.kind === "plan" && journey.recommended ? (
              <span className={styles.pill} data-tone="done">
                Recommended
              </span>
            ) : null}
          </span>
          <span className={styles.rowMeta}>
            {summary
              ? finished
                ? `Finished · ${summary.totalDays} days`
                : `Day ${summary.dayNumber} of ${summary.totalDays} · ${summary.listened} listened`
              : "Each new episode on the day it comes out"}
          </span>
        </span>
        {finished ? null : (
          <button
            type="button"
            onClick={onChangeJourney}
            className={styles.btn}
            data-quiet=""
            data-small=""
          >
            Change
          </button>
        )}
      </div>

      {summary && !finished ? (
        <div className="px-3.5 pb-3.5">
          <div
            className={styles.meter}
            role="progressbar"
            aria-label="Episodes listened"
            aria-valuemin={0}
            aria-valuemax={summary.totalDays}
            aria-valuenow={summary.listened}
          >
            <i style={{ width: `${progressPercent(summary.listened, summary.totalDays)}%` }} />
          </div>
        </div>
      ) : null}

      {summary && finished ? (
        <div className={`${styles.panelPad} pt-0`}>
          <p className={styles.note}>
            {summary.listened === summary.totalDays
              ? `You listened to every episode of ${journey.title}. Choose what to listen to next.`
              : `You’ve reached the end of ${journey.title}. Catch up on any you missed below, or choose what’s next.`}
          </p>
          <button type="button" onClick={onChangeJourney} className={`${styles.btn} w-fit`}>
            Choose what’s next
          </button>
        </div>
      ) : null}

      {journey.fellBack ? (
        <p className={`${styles.helper} px-3.5 pb-3`}>
          The journey you chose isn’t available right now, so you’re seeing {journey.title}.
        </p>
      ) : null}
    </section>
  );
}
