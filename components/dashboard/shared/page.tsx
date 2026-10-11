import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  dashboardFont,
  eyebrowText,
  focusRing,
  pageGutter,
  pageTitleText,
  sectionTitleText,
} from "./ui";

/**
 * Pure page pieces shared by the live dashboard and the public demo. No hooks,
 * no client directive and no server-only imports, so either side can render
 * them; links arrive already resolved and actions arrive as slots.
 */

/**
 * Content column for a live dashboard page (the demo shell supplies its own).
 * `className` styles the left-aligned inner block, as the demo's pages do.
 */
export function DashboardPageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(pageGutter, dashboardFont, "text-(--color-text)")}>
      <div className={cn("min-w-0 max-w-full", className)}>{children}</div>
    </div>
  );
}

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="grid min-w-0 gap-1.5">
        {/* A div, not a p: the eyebrow can hold a link. */}
        {eyebrow ? <div className={eyebrowText}>{eyebrow}</div> : null}
        <h1 className={pageTitleText}>{title}</h1>
        {description ? (
          <p className="max-w-[60ch] text-[13.5px] leading-relaxed text-(--color-text-muted)">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

/** Eyebrow link back to a parent page, e.g. the Welcome Pack hub. */
export function EyebrowLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn("rounded-sm transition-colors hover:text-(--color-brand-blue)", focusRing)}
    >
      {children}
    </Link>
  );
}

export function DashboardSection({
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
        <h2 className={sectionTitleText}>{title}</h2>
        {detail ? <p className="text-[12.5px] text-(--color-text-muted)">{detail}</p> : null}
        {action}
      </div>
      {children}
    </section>
  );
}

/** Sky line-icon chip. */
export function IconChip({ icon: Icon, className }: { icon: LucideIcon; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-(--color-brand-sky) text-(--color-brand-blue)",
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
