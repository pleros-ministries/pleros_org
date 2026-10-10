"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, LockIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { OVERALL_LABELS, STATUS_LABELS } from "@/lib/preview/pleros/daily-report";
import type { CategoryStatus, OverallStatus } from "@/lib/preview/pleros/types";

import motion from "./demo.module.css";

/**
 * Small, shared pieces of the demo's light product shell. Everything reads
 * the existing brand tokens; nothing here defines new colours.
 */

export const panel = "rounded-[var(--radius-lg)] border border-(--color-line) bg-white";
export const hairline = "border-(--color-line)";

const buttonBase =
  "inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition-[background-color,color,border-color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50";

export const buttonPrimary = `${buttonBase} bg-(--color-brand-blue) text-white hover:bg-(--color-brand-blue-hover)`;
export const buttonSecondary = `${buttonBase} border border-(--color-line-strong) bg-white text-(--color-text-strong) hover:border-(--color-brand-blue) hover:text-(--color-brand-blue)`;
export const buttonQuiet = `${buttonBase} px-3 text-(--color-brand-blue) hover:bg-(--color-brand-sky-soft)`;
export const buttonSmall =
  "inline-flex min-h-8 items-center justify-center gap-1 rounded-full border border-(--color-line-strong) bg-white px-3 text-[12.5px] font-medium text-(--color-text-strong) transition-colors hover:border-(--color-brand-blue) hover:text-(--color-brand-blue) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) disabled:cursor-not-allowed disabled:opacity-50";
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus)";

// ─── Dates ─────────────────────────────────────────────────────────────────

const longFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const shortFormat = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});
const weekdayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });

function asDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

/** "Friday 9 October" */
export function longDate(dateKey: string): string {
  return longFormat.format(asDate(dateKey)).replace(",", "");
}

/** "Fri 9 Oct" */
export function shortDate(dateKey: string): string {
  return shortFormat.format(asDate(dateKey)).replace(",", "");
}

export function weekday(dateKey: string): string {
  return weekdayFormat.format(asDate(dateKey));
}

export function dayNumber(dateKey: string): number {
  return asDate(dateKey).getUTCDate();
}

/** "Today", "Yesterday" or "Wed 7 Oct". */
export function relativeDay(dateKey: string, today: string): string {
  if (dateKey === today) return "Today";
  const yesterday = asDate(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  if (dateKey === yesterday.toISOString().slice(0, 10)) return "Yesterday";
  return shortDate(dateKey);
}

// ─── Headers and labels ────────────────────────────────────────────────────

export function PageHeader({
  eyebrow,
  title,
  titleClassName,
  description,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  titleClassName?: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="grid gap-3">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="grid min-w-0 gap-1.5">
          {/* A div, not a p: the eyebrow can hold a breadcrumb nav and list. */}
          {eyebrow ? <div data-dashboard-eyebrow className="text-[10px] font-medium uppercase leading-snug tracking-[0.08em] text-(--color-text-muted)">{eyebrow}</div> : null}
          <h1 className={cn("text-[24px] font-medium leading-[1.1] tracking-[-0.025em] text-(--color-text-strong)", titleClassName)}>
            {title}
          </h1>
          {description ? (
            <p className="max-w-[60ch] text-[15px] leading-relaxed text-(--color-text-muted)">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}

export function SectionTitle({
  id,
  title,
  detail,
  action,
}: {
  id?: string;
  title: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id={id} className="text-[15px] font-medium tracking-[-0.015em] text-(--color-text-strong)">
        {title}
      </h2>
      {detail ? <p className="text-[13px] text-(--color-text-muted)">{detail}</p> : null}
      {action}
    </div>
  );
}

type BadgeTone = "preview" | "confirm" | "neutral" | "blue" | "done";

const BADGE_TONES: Record<BadgeTone, string> = {
  preview: "border border-dashed border-(--color-brand-blue)/35 bg-(--color-brand-sky-soft) text-(--color-brand-blue)",
  confirm: "border border-amber-300/70 bg-amber-50 text-amber-900",
  neutral: "border border-(--color-line) bg-(--color-surface-muted) text-(--color-text-muted)",
  blue: "bg-(--color-brand-sky) text-(--color-brand-blue)",
  done: "bg-(--color-brand-lime) text-(--color-brand-blue)",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium leading-5",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ─── Report status ─────────────────────────────────────────────────────────

const STATUS_PILL: Record<CategoryStatus, string> = {
  activity: "bg-(--color-brand-sky) text-(--color-brand-blue)",
  nil: "bg-(--color-surface-muted) text-(--color-text) ring-1 ring-inset ring-(--color-line-strong)",
  missing: "border border-dashed border-(--color-line-strong) text-(--color-text-muted)",
};

export function StatusPill({ status, label }: { status: CategoryStatus; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium",
        STATUS_PILL[status],
      )}
    >
      {status === "activity" ? <CheckIcon className="size-3.5" strokeWidth={2.5} aria-hidden /> : null}
      {status === "nil" ? <span aria-hidden className="h-px w-2.5 bg-current" /> : null}
      {label ?? STATUS_LABELS[status]}
    </span>
  );
}

export function OverallPill({ status }: { status: OverallStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[12px] font-medium",
        status === "complete" && "bg-(--color-brand-lime) text-(--color-brand-blue)",
        status === "in_progress" && "bg-(--color-brand-sky-soft) text-(--color-brand-blue)",
        status === "not_started" && "border border-dashed border-(--color-line-strong) text-(--color-text-muted)",
      )}
    >
      {status === "complete" ? <CheckIcon className="size-3.5" strokeWidth={2.5} aria-hidden /> : null}
      {OVERALL_LABELS[status]}
    </span>
  );
}

const MARK_LABEL: Record<CategoryStatus, string> = {
  activity: "reported",
  nil: "nil",
  missing: "not yet reported",
};

/**
 * The demo's signature: three short bars for devotional, ministry and
 * meetings. Solid is reported, a thin line is an explicit nil, dashed is not
 * yet reported.
 */
export function ReportMark({
  statuses,
  size = "md",
  className,
}: {
  statuses: CategoryStatus[];
  size?: "sm" | "md";
  className?: string;
}) {
  const names = ["Devotional", "Ministry", "Meetings"];
  return (
    <span
      role="img"
      aria-label={statuses.map((status, index) => `${names[index]} ${MARK_LABEL[status]}`).join(", ")}
      className={cn("inline-flex items-center", size === "sm" ? "gap-0.5 sm:gap-[3px]" : "gap-[3px]", className)}
    >
      {statuses.map((status, index) => (
        <span
          key={index}
          className={cn(
            "relative rounded-full transition-colors duration-200",
            size === "sm" ? "h-1 w-[7px] sm:h-[5px] sm:w-2.5" : "h-1.5 w-4",
            status === "activity" && "bg-(--color-brand-blue)",
            status === "nil" && "bg-(--color-brand-sky) ring-1 ring-inset ring-(--color-brand-blue)/45",
            status === "missing" && "border border-dashed border-(--color-text-muted)/60",
          )}
        />
      ))}
    </span>
  );
}

// ─── Layout pieces ─────────────────────────────────────────────────────────

export function StatStrip({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; detail?: ReactNode; accent?: ReactNode; href?: string }>;
}) {
  return (
    <dl
      className={cn(
        panel,
        "grid grid-cols-2 divide-(--color-line) overflow-hidden max-sm:[&>div:nth-child(n+3)]:border-t sm:grid-cols-4 sm:divide-x",
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={cn(
            "relative grid content-start gap-1 px-4 py-3.5 sm:px-5 sm:py-4",
            item.href && "transition-colors hover:bg-(--color-brand-sky-soft)",
            index % 2 === 1 && "max-sm:border-l max-sm:border-(--color-line)",
          )}
        >
          <dt className="text-[12.5px] text-(--color-text-muted)">
            {item.href ? <Link href={item.href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-(--color-focus)">{item.label}</Link> : item.label}
          </dt>
          <dd className="flex items-center gap-2 text-[22px] font-medium tabular-nums tracking-[-0.02em] text-(--color-text-strong)">
            {item.value}
            {item.accent}
          </dd>
          {item.detail ? <dd className="text-[12.5px] leading-snug text-(--color-text-muted)">{item.detail}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="grid justify-items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-(--color-line-strong) bg-white/70 px-6 py-9 text-center">
      {icon ? (
        <span className="grid size-10 place-items-center rounded-full bg-(--color-brand-sky-soft) text-(--color-brand-blue)">
          {icon}
        </span>
      ) : null}
      <div className="grid max-w-sm gap-1">
        <p className="text-[15px] font-medium text-(--color-text-strong)">{title}</p>
        {children ? <div className="text-[13.5px] leading-relaxed text-(--color-text-muted)">{children}</div> : null}
      </div>
      {action}
    </div>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ key: T; label: ReactNode; count?: number }>;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="inline-flex rounded-full border border-(--color-line) bg-(--color-surface-muted) p-0.5"
    >
      {options.map((option, index) => {
        const selected = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.key)}
            onKeyDown={(event) => {
              const key = event.key;
              if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(key)) return;
              event.preventDefault();
              const next = key === "Home" ? 0 : key === "End" ? options.length - 1 :
                (index + (key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1) + options.length) % options.length;
              onChange(options[next]!.key);
              event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button[role='radio']")[next]?.focus();
            }}
            className={cn(
              "inline-flex min-h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150",
              focusRing,
              selected
                ? "bg-white text-(--color-brand-blue) shadow-[0_1px_2px_rgba(6,16,86,0.08),0_0_0_1px_var(--color-line)]"
                : "text-(--color-text-muted) hover:text-(--color-text-strong)",
            )}
          >
            {option.label}
            {option.count !== undefined ? <CountBadge count={option.count} /> : null}
          </button>
        );
      })}
    </div>
  );
}

export function CountBadge({ count }: { count: number }) {
  return <span className="inline-grid size-5 shrink-0 place-items-center rounded-full bg-(--color-brand-sky) text-[11px] font-semibold leading-none tabular-nums text-(--color-brand-blue)">{count}</span>;
}

/**
 * The seven-day strip used by reports and oversight. Days older than the
 * write window carry a lock; selection only changes what is viewed.
 */
export function DayTracker({
  days,
  selected,
  today,
  onSelect,
  onShift,
  canShiftBack,
  writable,
  renderMark,
  describe,
  label = "Choose a day",
}: {
  /** Status words for the accessible name, since the visual mark sits inside a labelled button. */
  describe?: (day: string) => string;
  days: string[];
  selected: string;
  today: string;
  onSelect: (day: string) => void;
  onShift: (direction: -1 | 1) => void;
  canShiftBack: boolean;
  writable: (day: string) => boolean;
  renderMark: (day: string) => ReactNode;
  label?: string;
}) {
  const last = days.at(-1)!;
  return (
    <div className="flex items-stretch gap-0.5 sm:gap-1.5">
      <button
        type="button"
        onClick={() => onShift(-1)}
        disabled={!canShiftBack}
        aria-label="Earlier days"
        className={cn("grid w-6 shrink-0 place-items-center rounded-xl text-(--color-text-muted) hover:bg-white disabled:opacity-30 sm:w-8", focusRing)}
      >
        <ChevronLeftIcon className="size-4" aria-hidden />
      </button>
      <div role="group" aria-label={label} className="grid min-w-0 flex-1 grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day) => {
          const active = day === selected;
          const viewOnly = !writable(day);
          return (
            <button
              key={day}
              type="button"
              aria-pressed={active}
              aria-current={day === today ? "date" : undefined}
              aria-label={`${longDate(day)}${day === today ? ", today" : ""}${describe ? `, ${describe(day)}` : ""}${viewOnly ? ", view only" : ""}`}
              onClick={() => onSelect(day)}
              className={cn(
                "group relative grid min-h-[64px] min-w-0 justify-items-center content-start gap-1.5 overflow-hidden rounded-[calc(var(--radius-sm)/2)] border px-0 pb-2 pt-1.5 transition-[background-color,border-color,box-shadow] duration-150 sm:min-h-[68px] sm:gap-1",
                focusRing,
                active ? "border-(--color-brand-blue)" : "border-transparent hover:border-(--color-line)",
                day === today ? "bg-(--color-brand-lime) hover:bg-(--color-brand-lime)" : active ? "bg-white" : "hover:bg-white",
              )}
            >
              <span
                aria-hidden
                className={cn("flex items-center gap-0.5 text-[10px] font-medium leading-none sm:text-[11px] sm:uppercase sm:tracking-[0.06em]", day === today ? "text-(--color-brand-blue)" : "text-(--color-text-muted)")}
              >
                {day === today ? "Today" : weekday(day)}
                {viewOnly ? <LockIcon className="hidden size-2.5 opacity-60 sm:block" aria-hidden /> : null}
              </span>
              <span
                aria-hidden
                className={cn(
                  "text-[15px] font-medium tabular-nums leading-none",
                  (active || day === today) ? "text-(--color-brand-blue)" : viewOnly ? "text-(--color-text-muted)" : "text-(--color-text-strong)",
                )}
              >
                {dayNumber(day)}
              </span>
              {renderMark(day)}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => onShift(1)}
        disabled={last >= today}
        aria-label="Later days"
        className={cn("grid w-6 shrink-0 place-items-center rounded-xl text-(--color-text-muted) hover:bg-white disabled:opacity-30 sm:w-8", focusRing)}
      >
        <ChevronRightIcon className="size-4" aria-hidden />
      </button>
    </div>
  );
}

/**
 * A native modal dialog: focus moves in, Escape closes, focus returns.
 * Slides from the right on wide screens and up from the bottom on phones.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  header,
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  side?: "left" | "right";
  header?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className={cn(motion.sheet, "my-0 max-h-dvh border-0 bg-transparent p-0 backdrop:bg-[rgba(6,16,86,0.28)]", side === "left" ? `${motion.leftSheet} ml-0 mr-auto h-dvh w-[min(300px,90vw)] max-w-[300px]` : "mr-0 ml-auto h-dvh w-full max-w-[460px] max-sm:mb-0 max-sm:ml-0 max-sm:mt-auto max-sm:h-auto max-sm:max-h-[88dvh] max-sm:max-w-none")}
    >
      <div className={cn("flex h-full max-h-[inherit] flex-col bg-white shadow-[var(--shadow-lg)]", side === "left" ? "border-r border-(--color-line)" : "sm:border-l sm:border-(--color-line) max-sm:rounded-t-[var(--radius-xl)]")}>
        <div className="flex items-start justify-between gap-4 border-b border-(--color-line) px-5 py-4">
          <div className="grid min-w-0 flex-1 gap-0.5">
            <h2 id={titleId} className={header ? "sr-only" : "text-[15px] font-medium tracking-[-0.015em] text-(--color-text-strong)"}>
              {title}
            </h2>
            {header ?? (description ? <p className="text-[13px] text-(--color-text-muted)">{description}</p> : null)}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={cn("grid size-9 shrink-0 place-items-center rounded-full text-(--color-text-muted) hover:bg-(--color-surface-muted)", focusRing)}
          >
            <XIcon className="size-4" aria-hidden />
          </button>
        </div>
        <div className={cn("flex-1 overflow-y-auto", side === "left" ? "px-2 py-3" : "px-5 py-5")}>{children}</div>
        {footer ? <div className="border-t border-(--color-line) px-5 py-3.5">{footer}</div> : null}
      </div>
    </dialog>
  );
}

export function Initials({ name, imageSrc, size = "md", tone = "sky" }: { name: string; imageSrc?: string; size?: "sm" | "md" | "lg"; tone?: "sky" | "blue" }) {
  const letters = name
    .replace(/^Pastor\s+/, "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  return (
    <span
      aria-hidden
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full font-medium tracking-[0.02em]",
        size === "sm" && "size-7 text-[11px]",
        size === "md" && "size-9 text-[13px]",
        size === "lg" && "size-11 text-[15px]",
        tone === "sky" ? "bg-(--color-brand-sky) text-(--color-brand-blue)" : "bg-(--color-brand-blue) text-white",
      )}
    >
      {imageSrc ? <Image src={imageSrc} alt="" fill unoptimized className="object-cover" /> : letters}
    </span>
  );
}
