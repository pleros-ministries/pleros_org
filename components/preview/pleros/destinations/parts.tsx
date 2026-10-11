"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRightIcon, CheckIcon, ChevronDownIcon, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { focusRing, panel } from "../ui";

/**
 * Small pieces shared by the demo destinations. They read the existing brand
 * tokens and the demo's own primitives; nothing here fetches or persists.
 */

type Icon = LucideIcon;

export function IconChip({ icon: IconComponent, className }: { icon: Icon; className?: string }) {
  return (
    <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-full bg-(--color-brand-sky) text-(--color-brand-blue)", className)}>
      <IconComponent className="size-4" />
    </span>
  );
}

/** A section with a 15px heading and an optional trailing action. */
export function Section({
  title,
  detail,
  action,
  children,
  className,
}: {
  title: ReactNode;
  detail?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid content-start gap-3", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-[15px] font-medium tracking-[-0.015em] text-(--color-text-strong)">{title}</h2>
        {detail ? <p className="text-[12.5px] text-(--color-text-muted)">{detail}</p> : null}
        {action}
      </div>
      {children}
    </section>
  );
}

/** A divided list inside the standard panel. */
export function ListPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn(panel, "divide-y divide-(--color-line) overflow-hidden", className)}>{children}</ul>;
}

export function Row({
  icon,
  title,
  detail,
  trailing,
  href,
  className,
}: {
  icon?: Icon;
  title: ReactNode;
  detail?: ReactNode;
  trailing?: ReactNode;
  href?: string;
  className?: string;
}) {
  const body = (
    <>
      {icon ? <IconChip icon={icon} /> : null}
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="truncate text-[13.5px] font-medium text-(--color-text-strong)">{title}</span>
        {detail ? <span className="text-[12.5px] leading-snug text-(--color-text-muted)">{detail}</span> : null}
      </span>
      {trailing}
    </>
  );
  return (
    <li className={className}>
      {href ? (
        <Link href={href} className={cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-(--color-brand-sky-soft) sm:px-5", focusRing)}>
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5">{body}</div>
      )}
    </li>
  );
}

export function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} className="h-1.5 overflow-hidden rounded-full bg-(--color-surface-muted)">
      <div className="h-full rounded-full bg-(--color-brand-blue) transition-[width] duration-300" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** A round tick used for local, demo-only completion toggles. */
export function Tick({
  done,
  onToggle,
  label,
  disabled,
}: {
  done: boolean;
  onToggle?: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={done}
      aria-label={label}
      disabled={disabled || !onToggle}
      onClick={onToggle}
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-150 disabled:cursor-default",
        focusRing,
        done
          ? "border-transparent bg-(--color-brand-lime) text-(--color-brand-blue)"
          : "border-(--color-line-strong) bg-white text-transparent hover:border-(--color-brand-blue) disabled:hover:border-(--color-line-strong)",
      )}
    >
      <CheckIcon className="size-4" strokeWidth={2.5} aria-hidden />
    </button>
  );
}

/** A public page or published media outside the demo. Plain links; nothing is sent. */
export function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cn("inline-flex items-center gap-1 text-[12.5px] font-medium text-(--color-brand-blue) hover:underline", focusRing, className)}>
      {children}
      <ArrowUpRightIcon className="size-3.5" aria-hidden />
    </a>
  );
}

/** A native disclosure styled like the demo's collapsible panels. */
export function Disclosure({
  summary,
  children,
  defaultOpen,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="group">
      <summary className={cn("flex cursor-pointer list-none items-center gap-3 px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden", focusRing)}>
        <span className="min-w-0 flex-1">{summary}</span>
        <ChevronDownIcon className="size-4 shrink-0 text-(--color-text-muted) transition-transform duration-200 group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-(--color-line) px-4 py-3 sm:px-5">{children}</div>
    </details>
  );
}

/** Field label and control styles that match the demo's report forms. */
export const fieldLabel = "text-[13px] font-medium text-(--color-text-strong)";
export const fieldControl =
  "min-h-10 w-full rounded-[var(--radius-sm)] border border-(--color-line-strong) bg-white px-3 text-[16px] text-(--color-text-strong) placeholder:text-(--color-text-muted) focus-visible:border-(--color-brand-blue) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-focus) sm:text-[14px]";
export const selectControl = `${fieldControl} appearance-none pr-9`;

export function Field({ label, children, hint }: { label: ReactNode; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className={fieldLabel}>{label}</span>
      {children}
      {hint ? <span className="text-[12px] text-(--color-text-muted)">{hint}</span> : null}
    </label>
  );
}

const monthFormat = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });

/** "October 2026" for a date key. */
export function monthLabel(dateKey: string): string {
  return monthFormat.format(new Date(`${dateKey}T00:00:00.000Z`));
}

/** "Joined Sep 2026": peers see a join month, never a date. */
export function joinMonth(dateKey: string): string {
  return `Joined ${new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${dateKey}T00:00:00.000Z`))}`;
}
