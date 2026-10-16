"use client";

import { useQuery } from "@tanstack/react-query";

import { communityKeys } from "@/lib/community/query-keys";

async function fetchUnreadTotal(): Promise<number> {
  const res = await fetch("/api/community/messages?summary=1", {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to load unread messages");
  const data = (await res.json()) as { unreadTotal: number };
  return data.unreadTotal;
}

/** Unread private messages for the nav badge; navigation never forces a refetch. */
export function useUnreadMessages(): number {
  const { data } = useQuery({
    queryKey: communityKeys.unreadMessages(),
    queryFn: fetchUnreadTotal,
    staleTime: 60_000,
    refetchInterval: 120_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
  });
  return data ?? 0;
}
