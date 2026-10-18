"use client";

import { useState, type ReactNode } from "react";
import { EllipsisIcon, type LucideIcon } from "lucide-react";
import { Popover } from "@base-ui/react/popover";

export type MenuAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  onSelect: () => void;
};

/** The "…" options menu used on posts and conversations. Renders nothing when empty. */
export function ActionMenu({
  label,
  actions,
  className = "",
  trigger,
}: {
  label: string;
  actions: MenuAction[];
  className?: string;
  /** A visible button label (e.g. "Follow up") instead of the "…" icon. */
  trigger?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  if (actions.length === 0) return null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={label}
        className={trigger
          ? `inline-flex h-7 shrink-0 items-center gap-1 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white px-2.5 text-[12px] font-medium text-[var(--color-community-ink)] transition-colors hover:border-[var(--color-community-edge-strong)] ${className}`
          : `inline-flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--color-community-muted)] transition-colors hover:bg-[var(--color-community-canvas)] hover:text-[var(--color-community-ink)] ${className}`}
      >
        {trigger ?? <EllipsisIcon className="size-[18px]" strokeWidth={2} />}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="end">
          <Popover.Popup className="pleros-popover-motion site-font-theme z-50 w-48 rounded-[10px] border border-[var(--dashboard-panel-edge,#e2e5ea)] bg-white p-1 text-[13px] shadow-[0_8px_24px_rgb(37_43_51/12%)] outline-none">
            <div className="grid gap-0.5">
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      action.onSelect();
                    }}
                    className={`flex h-9 items-center gap-2.5 rounded-[7px] px-2.5 text-left transition-colors hover:bg-[var(--color-community-canvas)] ${
                      action.danger ? "text-red-700" : "text-[var(--color-community-ink)]"
                    }`}
                  >
                    <Icon
                      className={`size-4 ${
                        action.danger ? "text-red-600" : "text-[var(--color-community-muted)]"
                      }`}
                      strokeWidth={2}
                    />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
