"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { BellIcon } from "lucide-react";

import { markCommunityNotificationsRead } from "@/app/(site)/dashboard/community/_actions/leader-actions";

type Notification = {
  id: number;
  kind: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

function summarise(n: Notification): string {
  switch (n.kind) {
    case "official_post":
      return `New update: ${(n.payload.title as string) ?? "open the community"}`;
    case "thread_reply":
      return `New reply in "${(n.payload.title as string) ?? "a discussion"}"`;
    case "message_reply":
      return `Someone replied to you in "${(n.payload.title as string) ?? "a discussion"}"`;
    case "made_leader":
      return `You now lead ${(n.payload.unitName as string) ?? "your unit"}`;
    case "flag_resolved":
      return `Your report was ${(n.payload.outcome as string) ?? "reviewed"}`;
    case "leader_nudge":
      return (n.payload.message as string) ?? "A note from your unit leader";
    default:
      return "Community update";
  }
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [, startTransition] = useTransition();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/community/notifications", {
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: Notification[];
        unread: number;
      };
      setItems(data.notifications);
      setUnread(data.unread);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      startTransition(async () => {
        await markCommunityNotificationsRead().catch(() => {});
      });
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Community notifications"
        className="relative inline-flex size-8 items-center justify-center rounded-full text-white/85 hover:text-white"
      >
        <BellIcon className="size-4" strokeWidth={2} />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-[var(--color-brand-lime)] px-1 text-[0.6rem] font-bold text-[var(--color-brand-blue)]">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-9 z-40 w-72 rounded-sm border border-zinc-200 bg-white p-2 shadow-lg">
          {items.length === 0 ? (
            <p className="p-2 text-xs text-zinc-500">Nothing yet.</p>
          ) : (
            <ul className="grid max-h-80 gap-1 overflow-y-auto">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-sm px-2 py-1.5 text-xs ${
                    item.readAt ? "text-zinc-500" : "bg-zinc-50 text-zinc-800"
                  }`}
                >
                  {summarise(item)}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
