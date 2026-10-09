import {
  SOGP_TASK_PRIMARY_BUTTON,
  SOGP_TASK_SECONDARY_BUTTON,
} from "@/components/sogp/sogp-daily-tasks";
import type {
  PodcastJourneySummary,
  ResolvedPodcastJourney,
} from "@/lib/podcast-journey";

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
    <section className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-zinc-400">
            Your journey
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="ppc-heading text-lg font-semibold text-zinc-900">
              {journey.title}
            </h2>
            {journey.kind === "plan" && journey.recommended ? (
              <span className="rounded-full bg-(--color-brand-lime) px-2 py-0.5 text-[0.62rem] font-semibold text-(--color-brand-blue)">
                Recommended
              </span>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500">
            {summary
              ? finished
                ? `Finished · ${summary.totalDays} days`
                : `Day ${summary.dayNumber} of ${summary.totalDays}`
              : "Each new episode on the day it comes out"}
          </p>
        </div>
        {finished ? null : (
          <button
            type="button"
            onClick={onChangeJourney}
            className={SOGP_TASK_SECONDARY_BUTTON}
          >
            Change journey
          </button>
        )}
      </div>

      {summary ? (
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-zinc-500">Episodes listened</span>
            <strong className="ppc-heading font-semibold text-zinc-900">
              {summary.listened} of {summary.totalDays}
            </strong>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-(--color-brand-blue)"
              style={{
                width: `${progressPercent(summary.listened, summary.totalDays)}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {summary && finished ? (
        <div className="grid gap-2 rounded-md bg-(--color-brand-sky-soft) p-3">
          <p className="ppc-heading text-sm font-semibold text-zinc-900">
            You’ve reached the end of {journey.title}
          </p>
          <p className="text-xs leading-[1.5] text-zinc-600">
            {summary.listened === summary.totalDays
              ? "You listened to every episode. Choose what to listen to next."
              : "Catch up on any you missed below, or choose what to listen to next."}
          </p>
          <button
            type="button"
            onClick={onChangeJourney}
            className={`${SOGP_TASK_PRIMARY_BUTTON} w-fit`}
          >
            Choose what’s next
          </button>
        </div>
      ) : null}

      {journey.fellBack ? (
        <p className="text-xs leading-[1.5] text-zinc-500">
          The journey you chose isn’t available right now, so you’re seeing{" "}
          {journey.title}.
        </p>
      ) : null}
    </section>
  );
}
