"use client";

import { Popover } from "@base-ui/react/popover";
import { CheckIcon, ChevronDownIcon, type LucideIcon } from "lucide-react";

export type ChipOption = { value: string; label: string };

/**
 * A compact chip that opens a short checked menu: the dashboard's
 * replacement for wide native selects in toolbars (sort, topic, audience).
 */
export function ChipSelect({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  placeholder,
  menuTitle,
  align = "start",
  size = "sm",
}: {
  /** Accessible name, e.g. "Topic". */
  label: string;
  value: string;
  options: ChipOption[];
  onChange: (value: string) => void;
  icon?: LucideIcon;
  /** Shown when `value` matches no option (e.g. no topic yet). */
  placeholder?: string;
  menuTitle?: string;
  align?: "start" | "end";
  /** `md` is the 32px compact control, for forms rather than toolbars. */
  size?: "sm" | "md";
}) {
  const md = size === "md";
  const current = options.find((option) => option.value === value);
  const text = current?.label ?? placeholder ?? label;
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        aria-label={`${label}: ${text}`}
        className={`inline-flex shrink-0 items-center border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white font-medium ${md ? "h-10 w-full min-w-0 gap-2 rounded-[10px] px-3 text-[14px]" : "h-6 max-w-[9.5rem] gap-1 rounded-full pr-1.5 pl-2 text-[12px]"} transition-colors hover:border-[var(--color-community-edge-strong)] data-[popup-open]:border-[var(--color-community-blue)] ${
          current ? "text-[var(--color-community-ink)]" : "text-[var(--color-community-muted)]"
        }`}
      >
        {Icon ? <Icon className={`${md ? "size-4" : "size-3"} shrink-0 text-[var(--color-community-muted)]`} strokeWidth={2} /> : null}
        <span className={md ? "min-w-0 flex-1 truncate text-left" : "truncate"}>{text}</span>
        <ChevronDownIcon className={`${md ? "size-4" : "size-3"} shrink-0 text-[var(--color-community-muted)]`} strokeWidth={2.2} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align={align}>
          <Popover.Popup className={`pleros-popover-motion z-50 max-h-72 ${md ? "w-[var(--anchor-width)]" : "w-48"} overflow-auto rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white p-1 shadow-[0_8px_24px_rgb(37_43_51/12%)] outline-none`}>
            {menuTitle ? (
              <p className="m-0 px-2.5 pt-1.5 pb-1 text-[11px] font-medium tracking-[0.04em] text-[var(--color-community-muted)] uppercase">{menuTitle}</p>
            ) : null}
            {options.map((option) => {
              const active = option.value === value;
              return (
                <Popover.Close
                  key={option.value}
                  onClick={() => onChange(option.value)}
                  aria-pressed={active}
                  className={`flex h-9 w-full items-center gap-2.5 rounded-[7px] px-2.5 text-left text-[13px] text-[var(--color-community-ink)] transition-colors hover:bg-[var(--color-community-canvas)] ${active ? "font-semibold" : ""}`}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {active ? <CheckIcon className="size-4 text-[var(--color-community-blue)]" strokeWidth={2.2} /> : null}
                </Popover.Close>
              );
            })}
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
