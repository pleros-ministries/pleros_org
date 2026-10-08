import { CheckIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import { SETUP_NOTE } from "./styles";

/**
 * One numbered step in the Welcome Pack setup. The number turns into a lime
 * tick once the step is done.
 */
export function StepCard({
  number,
  title,
  description,
  done,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <li className="grid gap-4 rounded-[var(--radius-md)] bg-white p-4 shadow-[var(--shadow-sm)] ring-1 ring-[rgba(6,16,86,0.08)] sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full font-[var(--font-be-vietnam-pro)] text-[0.8125rem] font-semibold",
            done
              ? "bg-[var(--color-brand-lime)] text-[var(--color-brand-blue)]"
              : "bg-[var(--color-brand-blue)] text-white",
          )}
        >
          {done ? <CheckIcon className="size-4" strokeWidth={2.5} /> : number}
        </span>
        <div className="grid min-w-0 gap-1 pt-0.5">
          <h2 className="site-pathway-title text-[1.15rem] leading-tight text-[var(--color-brand-blue)]">
            {title}
            {done ? <span className="sr-only"> (done)</span> : null}
          </h2>
          {description ? (
            <p className={cn("font-[var(--font-be-vietnam-pro)]", SETUP_NOTE)}>
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div className="grid min-w-0 gap-3 font-[var(--font-be-vietnam-pro)] text-[0.875rem] leading-[1.5] text-[var(--color-text-strong)]">
        {children}
      </div>
    </li>
  );
}
