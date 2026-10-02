"use client";

import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

/*
 * Shared pieces for admin tables that collapse on phones: below Tailwind's
 * `md` breakpoint, secondary columns hide and a row tap reveals them in a
 * detail row instead of scrolling the table sideways.
 */

// Matches Tailwind's `md` breakpoint: from here up the full table shows and a
// row tap opens the enrollee; below it, a tap expands the row instead.
export function isDesktop() {
  return window.matchMedia("(min-width: 768px)").matches;
}

export function ExpandButton({
  expanded,
  controls,
  label,
  onToggle,
}: {
  expanded: boolean;
  controls: string;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      aria-label={`${expanded ? "Hide" : "Show"} ${label}`}
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      className="inline-flex size-7 items-center justify-center rounded-sm text-zinc-500 hover:bg-zinc-100"
    >
      <ChevronDown className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
    </button>
  );
}

export function DetailGrid({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-sm border border-zinc-200 bg-white p-3">
      {items.map(([label, value]) => (
        <div key={label} className="grid gap-0.5">
          <dt className="text-[10px] text-zinc-500">{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
