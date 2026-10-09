"use client";

import { useState, useTransition } from "react";

import { setPodcastLeaderboardVisibilityAction } from "@/app/_actions/podcast-journey-actions";
import { cn } from "@/lib/utils";

const SAVE_ERROR = "Your choice could not be saved. Try again.";

/** The opt-in switch for appearing on the podcast leaderboard. */
export function PodcastLeaderboardToggle({
  visible,
  previewMode = false,
  className,
}: {
  visible: boolean;
  previewMode?: boolean;
  className?: string;
}) {
  const [checked, setChecked] = useState(visible);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(next: boolean) {
    setChecked(next);
    setError(null);
    if (previewMode) return;

    startTransition(async () => {
      const result = await setPodcastLeaderboardVisibilityAction(next).catch(
        () => ({ ok: false as const, error: SAVE_ERROR }),
      );
      if (!result.ok) {
        setChecked(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className={cn("grid gap-1.5", className)}>
      <label className="flex cursor-pointer items-start justify-between gap-3">
        <span className="grid min-w-0 gap-0.5">
          <span className="text-xs font-semibold text-zinc-900">
            Show me on the leaderboard
          </span>
          <span className="text-[0.7rem] leading-[1.45] text-zinc-500">
            Only your first name and points are shown.
          </span>
        </span>
        <span className="relative mt-0.5 inline-flex shrink-0">
          <input
            type="checkbox"
            role="switch"
            checked={checked}
            disabled={pending}
            onChange={(event) => toggle(event.currentTarget.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className="h-5 w-9 rounded-full bg-zinc-300 transition-colors peer-checked:bg-(--color-brand-blue) peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-(--color-brand-blue) peer-disabled:opacity-50"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4"
          />
        </span>
      </label>
      {error ? (
        <p role="alert" className="text-[0.7rem] text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
