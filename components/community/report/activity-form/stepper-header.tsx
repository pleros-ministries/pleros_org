"use client";

import { CheckIcon } from "lucide-react";

import {
  STEP_TITLES,
  canJumpTo,
  type ActivityDraft,
  type StepId,
} from "@/lib/community/activity-form";

/** "Step 2 of 5", a thin progress bar and, when editing, a way to jump between steps. */
export function StepperHeader({
  steps,
  index,
  draft,
  canJump,
  onJump,
}: {
  steps: StepId[];
  index: number;
  draft: ActivityDraft;
  canJump: boolean;
  onJump: (index: number) => void;
}) {
  const total = steps.length;
  const current = index + 1;
  const kindChosen = total > 1;

  return (
    <div className="grid gap-2">
      <p role="status" className="text-xs font-medium text-zinc-600">
        {kindChosen ? `Step ${current} of ${total}` : "Step 1"}
      </p>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={Math.max(total, 1)}
        aria-label="Progress"
        className="h-1 w-full overflow-hidden rounded-full bg-zinc-100"
      >
        <div
          className="h-full rounded-full bg-(--color-brand-blue) transition-[width]"
          style={{ width: `${(current / Math.max(total, 1)) * 100}%` }}
        />
      </div>
      {canJump && kindChosen ? (
        <ol className="flex flex-wrap gap-1.5 pt-0.5">
          {steps.map((step, stepIndex) => {
            const active = stepIndex === index;
            const done = stepIndex < index;
            const allowed = canJumpTo(steps, stepIndex, draft);
            return (
              <li key={step}>
                <button
                  type="button"
                  onClick={() => onJump(stepIndex)}
                  disabled={!allowed}
                  aria-current={active ? "step" : undefined}
                  className={`inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                    active
                      ? "border-(--color-brand-blue) text-(--color-brand-blue)"
                      : done
                        ? "border-transparent bg-(--color-brand-sky-soft) text-zinc-700"
                        : "border-zinc-200 text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {done ? <CheckIcon className="size-3" strokeWidth={2.5} aria-hidden /> : null}
                  {STEP_TITLES[step]}
                </button>
              </li>
            );
          })}
        </ol>
      ) : null}
    </div>
  );
}
