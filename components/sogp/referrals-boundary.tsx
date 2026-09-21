"use client";

import { Suspense } from "react";

import type { ReferralsDashboardData } from "@/lib/db/queries/sogp-referrals";

import { ReferralsPage } from "./referrals-page";
import { SogpDashboardSkeleton } from "./sogp-dashboard-skeleton";
import { SogpErrorBoundary } from "./sogp-error-boundary";

export function ReferralsBoundary({
  initialData,
}: {
  initialData?: ReferralsDashboardData;
}) {
  return (
    <SogpErrorBoundary>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <ReferralsPage initialData={initialData} />
      </Suspense>
    </SogpErrorBoundary>
  );
}
