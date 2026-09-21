"use client";

import { Suspense } from "react";

import type { LeaderboardData } from "@/lib/db/queries/sogp-leaderboard";

import { LeaderboardPage } from "./leaderboard-page";
import { SogpDashboardSkeleton } from "./sogp-dashboard-skeleton";
import { SogpErrorBoundary } from "./sogp-error-boundary";

export function LeaderboardBoundary({
  initialData,
}: {
  initialData?: LeaderboardData;
}) {
  return (
    <SogpErrorBoundary>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <LeaderboardPage initialData={initialData} />
      </Suspense>
    </SogpErrorBoundary>
  );
}
