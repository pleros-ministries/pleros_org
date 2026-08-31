"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";

export function SogpActivitySection({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
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
          className={`flex w-full gap-3 border-b border-[var(--color-line)] bg-[var(--color-surface-muted)] px-4 py-4 text-left transition-colors duration-150 hover:bg-[var(--color-line)] md:px-5 ${description ? "min-h-20 items-start" : "min-h-16 items-center"}`}
        >
          <span className="grid min-w-0 flex-1 gap-0.5">
            <span className="flex items-center gap-2">
              {icon}
              <span className="font-[var(--font-sen)] text-base font-semibold text-[var(--color-text-strong)]">
                {title}
              </span>
            </span>
            {description ? (
              <span className="text-xs leading-[1.45] text-[var(--color-text-muted)]">
                {description}
              </span>
            ) : null}
          </span>
          <ChevronDownIcon
            className={`size-4 shrink-0 text-[var(--color-text-muted)] transition-transform duration-150 ${description ? "mt-1" : ""} ${expanded ? "rotate-180" : ""}`}
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
