"use client";

import { CheckIcon, CircleIcon } from "lucide-react";

export function SogpDailyRequirements({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    description: string;
    complete: boolean;
    actionLabel: string;
    pending?: boolean;
    disabled?: boolean;
    onToggle: () => void;
  }>;
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white p-4 sm:grid-cols-[1fr_auto] sm:items-center"
        >
          <div className="grid grid-cols-[1.5rem_1fr] gap-2.5">
            <span
              className={`mt-0.5 grid size-5 place-items-center rounded-full ${
                item.complete
                  ? "bg-[var(--color-brand-lime)] text-[var(--color-brand-blue)]"
                  : "border border-[var(--color-line-strong)] text-[var(--color-text-muted)]"
              }`}
            >
              {item.complete ? <CheckIcon className="size-3" /> : <CircleIcon className="size-2.5" />}
            </span>
            <div className="grid gap-1">
              <h3 className="font-[var(--font-sen)] text-base font-semibold text-[var(--color-text-strong)]">
                {item.title}
              </h3>
              <p className="text-xs leading-[1.45] text-[var(--color-text-muted)]">
                {item.description}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={item.disabled || item.pending}
            onClick={item.onToggle}
            className="min-h-10 rounded-full border border-[var(--color-brand-blue)] px-4 text-xs font-semibold text-[var(--color-brand-blue)] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {item.pending ? "Saving…" : item.complete ? "Mark incomplete" : item.actionLabel}
          </button>
        </article>
      ))}
    </div>
  );
}
