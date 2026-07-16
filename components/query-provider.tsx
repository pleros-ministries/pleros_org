"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ADMIN_QUERY_DEFAULTS } from "@/lib/admin-query";

const queryClientsByUserId = new Map<string, QueryClient>();
const sessionCachePrimedUsers = new Set<string>();

function getQueryClient(userId: string) {
  const existingQueryClient = queryClientsByUserId.get(userId);
  if (existingQueryClient) {
    return existingQueryClient;
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        ...ADMIN_QUERY_DEFAULTS,
        refetchOnWindowFocus: false,
      },
    },
  });

  queryClientsByUserId.set(userId, queryClient);
  return queryClient;
}

export function QueryProvider({
  children,
  userId,
}: {
  children: React.ReactNode;
  userId: string;
}) {
  const [queryClient] = useState(
    () => getQueryClient(userId),
  );

  useEffect(() => {
    if (sessionCachePrimedUsers.has(userId)) {
      return;
    }

    sessionCachePrimedUsers.add(userId);
    void fetch("/api/auth/get-session", { credentials: "same-origin" })
      .then((response) => {
        if (!response.ok) {
          sessionCachePrimedUsers.delete(userId);
        }
      })
      .catch(() => {
        sessionCachePrimedUsers.delete(userId);
      });
  }, [userId]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
