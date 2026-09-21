"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";

import { communityKeys } from "@/lib/community/query-keys";
import { markCommunityNotificationsRead } from "@/app/(site)/dashboard/community/_actions/leader-actions";

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
    case "leader_nudge":
      return (n.payload.message as string) ?? "A note from your unit leader";
    default:
      return "Community update";
  }
}

export function NotificationBell({
  tone = "dark",
}: {
  tone?: "dark" | "light";
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: communityKeys.notifications(),
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
  });
  const items = data?.notifications ?? [];
  const unread = data?.unread ?? 0;

  const markReadMutation = useMutation({
    mutationFn: () => markCommunityNotificationsRead(),
    onMutate: () => {
      queryClient.setQueryData<{
        notifications: Notification[];
        unread: number;
      }>(communityKeys.notifications(), (old) =>
        old ? { ...old, unread: 0 } : old,
      );
    },
    onSettled: () =>
      queryClient.invalidateQueries({
        queryKey: communityKeys.notifications(),
      }),
  });

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) markReadMutation.mutate();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label="Community notifications"
        className={`relative inline-flex size-8 items-center justify-center rounded-full ${
          tone === "light"
            ? "text-zinc-500 hover:text-zinc-900"
            : "text-white/85 hover:text-white"
        }`}
      >
        <BellIcon className="size-4" strokeWidth={2} />
        {unread > 0 ? (
          <span
            className={`absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full px-1 text-[0.6rem] font-bold ${
              tone === "light"
                ? "bg-[var(--color-brand-blue)] text-white"
                : "bg-[var(--color-brand-lime)] text-[var(--color-brand-blue)]"
            }`}
          >
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
