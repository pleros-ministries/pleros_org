"use client";

import { useState } from "react";
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
}: {
  label: string;
  actions: MenuAction[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (actions.length === 0) return null;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        aria-label={label}
        className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 ${className}`}
      >
        <EllipsisIcon className="size-[18px]" strokeWidth={2} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={6} align="end">
          <Popover.Popup className="site-font-theme z-50 w-52 rounded-xl border border-zinc-200 bg-white p-1.5 text-sm shadow-lg outline-none">
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
                    className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-zinc-50 ${
                      action.danger ? "text-red-700" : "text-zinc-700"
                    }`}
                  >
                    <Icon
                      className={`size-4 ${
                        action.danger ? "text-red-600" : "text-zinc-400"
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
