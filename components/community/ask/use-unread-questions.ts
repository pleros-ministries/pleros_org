"use client";

import { useQuery } from "@tanstack/react-query";

import { communityKeys } from "@/lib/community/query-keys";

async function fetchUnreadQuestions(): Promise<number> {
  const res = await fetch("/api/community/ask", { credentials: "same-origin" });
  if (!res.ok) throw new Error("Failed to load question replies");
  const data = (await res.json()) as { unread: number };
  return data.unread;
}

/** How many Ask Pleros conversations have a reply the viewer has not opened. */
export function useUnreadQuestions(): number {
  const { data } = useQuery({
    queryKey: communityKeys.unreadQuestions(),
    queryFn: fetchUnreadQuestions,
    refetchInterval: 60_000,
  });
  return data ?? 0;
}
