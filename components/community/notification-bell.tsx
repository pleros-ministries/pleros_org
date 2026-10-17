"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";

import { communityKeys } from "@/lib/community/query-keys";
import { markCommunityNotificationsRead } from "@/app/(site)/dashboard/community/_actions/leader-actions";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import dashboardStyles from "@/components/dashboard/v3/dashboard.module.css";

type Notification = {
  id: number;
  kind: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
};

async function fetchNotifications(): Promise<{
  notifications: Notification[];
  unread: number;
}> {
  const res = await fetch("/api/community/notifications", {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to load notifications");
  return res.json();
}

async function fetchNotificationSummary(): Promise<number> {
  const res = await fetch("/api/community/notifications?summary=1", {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to load notification count");
  const data = (await res.json()) as { unread: number };
  return data.unread;
}

function summarise(n: Notification): string {
  switch (n.kind) {
    case "official_post":
      return `New update: ${(n.payload.title as string) ?? "open the community"}`;
    case "post_comment":
      return `New comment on "${(n.payload.title as string) ?? "your post"}"`;
    case "comment_reply":
      return `Someone replied to your comment${
        n.payload.title ? ` on "${n.payload.title as string}"` : ""
      }`;
    case "made_leader":
      return `You now lead ${(n.payload.unitName as string) ?? "your unit"}`;
    case "flag_resolved":
      return `Your report was ${(n.payload.outcome as string) ?? "reviewed"}`;
    case "daily_report_reminder":
      return "Please complete your daily report.";
    case "leader_nudge":
      return (n.payload.message as string) ?? "A note from your unit leader";
    case "discipleship_joined":
      return `${(n.payload.name as string) ?? "Someone"} joined your discipleship group`;
    case "discipleship_prompt":
      return `New check-in from ${(n.payload.name as string) ?? "your discipler"}`;
    case "discipleship_response":
      return `${(n.payload.name as string) ?? "A disciple"} answered your check-in`;
    case "discipleship_reply":
      return `${(n.payload.name as string) ?? "Your discipler"} replied to your check-in`;
    case "discipleship_nudge":
      return `${(n.payload.name as string) ?? "Your discipler"}: ${(n.payload.message as string) ?? "thinking of you"}`;
    case "discipleship_alert":
      return (n.payload.message as string) ?? "Discipleship update";
    case "discipleship_digest":
      return (n.payload.message as string) ?? "Your discipleship week";
    case "discipleship_prayer_request":
      return `${(n.payload.name as string) ?? "A disciple"} shared a prayer request`;
    case "discipleship_prayed":
      return `${(n.payload.name as string) ?? "Your discipler"} prayed for your request`;
    case "discipleship_prayer_answered":
      return `${(n.payload.name as string) ?? "A disciple"} shared an answered prayer`;
    case "discipleship_post":
      return `${(n.payload.name as string) ?? "Someone"} posted in your discipleship group`;
    case "group_join_request":
      return `${(n.payload.name as string) ?? "Someone"} asked to join ${(n.payload.groupName as string) ?? "your group"}`;
    case "group_join_approved":
      return `You are now a member of ${(n.payload.groupName as string) ?? "the group"}`;
    case "pleros_reply":
      return "Pleros replied to your question";
    default:
      return "Community update";
  }
}

export function NotificationBell({
  tone = "dark",
  placement = "below",
  appearance,
}: {
  tone?: "dark" | "light";
  placement?: "below" | "sidebar";
  appearance?: "dashboard";
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);

  const summary = useQuery({
    queryKey: communityKeys.notificationSummary(),
    queryFn: fetchNotificationSummary,
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
  const { data, error, refetch } = useQuery({
    queryKey: communityKeys.notifications(),
    queryFn: fetchNotifications,
    enabled: open,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  const items = data?.notifications ?? [];
  const unread = summary.data ?? data?.unread ?? 0;

  const markReadMutation = useMutation({
    mutationFn: () => markCommunityNotificationsRead(),
    onMutate: () => {
      queryClient.setQueryData<number>(communityKeys.notificationSummary(), 0);
      queryClient.setQueryData<{
        notifications: Notification[];
        unread: number;
      }>(communityKeys.notifications(), (old) =>
        old ? { ...old, unread: 0 } : old,
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: communityKeys.notificationSummary() });
      void queryClient.invalidateQueries({ queryKey: communityKeys.notifications() });
    },
  });

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markReadMutation.mutate();
  }

  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        onClick={toggle}
        ref={trigger}
        aria-label={appearance === "dashboard" ? (unread > 0 ? `Notifications, ${unread} unread` : "Notifications") : "Community notifications"}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        className={appearance === "dashboard" ? dashboardStyles.iconButton : `relative inline-flex size-8 items-center justify-center rounded-full ${
          tone === "light"
            ? "text-[var(--color-community-muted)] hover:text-[var(--color-community-ink)]"
            : "text-white/85 hover:text-white"
        }`}
      >
        {appearance === "dashboard" ? <DashboardIcon name="bell" /> : <BellIcon className="size-4" strokeWidth={2} />}
        {unread > 0 && appearance === "dashboard" ? <span aria-hidden className={dashboardStyles.unread} /> : unread > 0 ? (
          <span
            className={`absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[0.6rem] font-bold ${
              tone === "light"
                ? "bg-[var(--color-community-blue)] text-white"
                : "bg-[var(--color-brand-lime)] text-[var(--color-community-blue)]"
            }`}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <div id={panelId} role="dialog" aria-label="Notifications" className={appearance === "dashboard" ? dashboardStyles.notificationPanel : `absolute z-40 w-72 rounded-sm border border-[var(--color-community-edge)] bg-white p-2 shadow-lg ${placement === "sidebar" ? "bottom-10 left-0" : "right-0 top-9"}`}>
          {error ? <div role="alert" className="p-2 text-sm"><p>Notifications couldn’t be loaded.</p><button className="mt-2 min-h-9 text-[var(--color-community-blue)]" onClick={() => void refetch()}>Try again</button></div> : !data ? <p role="status" className="p-2 text-sm text-(--color-text-muted)">Loading notifications…</p> : items.length === 0 ? (
            <p className="p-2 text-xs text-[var(--color-community-muted)]">Nothing yet.</p>
          ) : (
            <ul className="grid max-h-[min(20rem,calc(100dvh-8rem))] gap-1 overflow-y-auto">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-sm px-2 py-1.5 text-xs ${
                    item.readAt ? "text-[var(--color-community-muted)]" : "bg-[var(--color-community-canvas)] text-[var(--color-community-ink)]"
                  }`}
                >
                  {item.kind === "daily_report_reminder" ? <Link href={`/dashboard/community/report${typeof item.payload.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item.payload.day) ? `?day=${item.payload.day}` : ""}`} onClick={() => setOpen(false)}>{summarise(item)}</Link> : summarise(item)}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
