"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";

export function SogpActivitySection({
  step,
  title,
  description,
  icon,
  children,
}: {
  step: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(true);
  const panelId = useId();

  return (
    <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-line)] bg-white">
      <header>
        <button
          type="button"
          data-activity-header
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={() => setExpanded((current) => !current)}
          className="flex min-h-20 w-full items-start gap-3 border-b border-[var(--color-line)] px-4 py-4 text-left transition-colors duration-150 hover:bg-[var(--color-surface-muted)] md:px-5"
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--color-surface-muted)] font-[var(--font-sen)] text-xs font-semibold text-[var(--color-brand-blue)]">
            {step}
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="flex items-center gap-2">
              {icon}
              <span className="font-[var(--font-sen)] text-base font-semibold text-[var(--color-text-strong)]">
                {title}
              </span>
            </span>
            <span className="text-xs leading-[1.45] text-[var(--color-text-muted)]">
              {description}
            </span>
          </span>
          <ChevronDownIcon
            className={`mt-1 size-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
      </header>
      <div id={panelId} hidden={!expanded} className="grid gap-4 px-4 py-5 md:px-5 md:py-6">
        {children}
      </div>
    </section>
  );
}
