/** Shared class strings for the dashboard shell and home; brand tokens only. */

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-brand-blue)";

export const compactButton = `inline-flex h-8 items-center justify-center gap-1.5 rounded-md border border-(--color-line-strong) bg-white px-2.5 text-[12.5px] font-medium text-(--color-text-strong) transition-colors hover:border-(--color-brand-blue) hover:text-(--color-brand-blue) disabled:cursor-wait disabled:opacity-60 ${focusRing}`;

export const primaryButton = `inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-(--color-brand-blue) px-3 text-[12.5px] font-medium text-white transition-colors hover:bg-(--color-brand-blue-hover) ${focusRing}`;
