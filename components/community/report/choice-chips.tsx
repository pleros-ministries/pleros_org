"use client";

import type { ReactNode } from "react";

/**
 * Radio and checkbox choices drawn as cards, a segmented control or chips.
 * The real inputs stay in the markup (visually hidden) so keyboard and
 * screen-reader use is the browser's own; the styling follows `:checked`.
 */

export type ChoiceOption<T extends string> = {
  key: T;
  label: string;
  hint?: string;
  icon?: ReactNode;
};

const focusRing = "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-(--color-focus)";

const layouts = {
  cards: {
    group: "grid gap-2 sm:grid-cols-2",
    option: `flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3 text-left transition-colors hover:border-zinc-300 has-[:checked]:border-(--color-brand-blue) has-[:checked]:bg-(--color-brand-sky-soft) ${focusRing}`,
  },
  segmented: {
    group:
      "grid grid-cols-3 gap-0.5 rounded-full border border-(--color-line-strong) bg-white p-0.5",
    option: `inline-flex h-9 cursor-pointer items-center justify-center rounded-full px-3 text-[13px] font-medium text-zinc-600 transition-colors hover:text-zinc-900 has-[:checked]:bg-(--color-brand-blue) has-[:checked]:text-white ${focusRing}`,
  },
  chips: {
    group: "flex flex-wrap gap-2",
    option: `inline-flex h-8 cursor-pointer items-center rounded-full border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 has-[:checked]:border-(--color-brand-blue) has-[:checked]:bg-(--color-brand-blue) has-[:checked]:text-white ${focusRing}`,
  },
} as const;

/** One choice from several, with radio semantics. */
export function ChoiceGroup<T extends string>({
  id,
  name,
  value,
  onChange,
  onReselect,
  options,
  layout = "chips",
  invalid = false,
  disabled = false,
  describedBy,
  label,
}: {
  id?: string;
  name: string;
  value: T | null;
  onChange: (value: T) => void;
  /** Reopen an already selected activity after returning with Back. */
  onReselect?: (value: T) => void;
  options: ReadonlyArray<ChoiceOption<T>>;
  layout?: keyof typeof layouts;
  invalid?: boolean;
  disabled?: boolean;
  describedBy?: string;
  /** Accessible name for the group. */
  label: string;
}) {
  const classes = layouts[layout];
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      tabIndex={-1}
      className={`${classes.group} outline-none ${
        invalid ? "rounded-xl ring-4 ring-red-100" : ""
      }`}
    >
      {options.map((option) => (
        <label key={option.key} className={classes.option}>
          <input
            type="radio"
            name={name}
            value={option.key}
            checked={value === option.key}
            disabled={disabled}
            onChange={() => onChange(option.key)}
            onClick={() => { if (value === option.key) onReselect?.(option.key); }}
            className="sr-only"
          />
          {layout === "cards" ? (
            <>
              {option.icon ? (
                <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-(--color-brand-blue) ring-1 ring-zinc-200">
                  {option.icon}
                </span>
              ) : null}
              <span className="grid min-w-0 gap-0.5">
                <span className="text-sm font-medium text-zinc-900">{option.label}</span>
                {option.hint ? (
                  <span className="text-xs text-zinc-500">{option.hint}</span>
                ) : null}
              </span>
            </>
          ) : (
            option.label
          )}
        </label>
      ))}
    </div>
  );
}

/** An on/off choice drawn as a chip, with checkbox semantics. */
export function ToggleChip({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={layouts.chips.option}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="sr-only"
      />
      {label}
    </label>
  );
}
