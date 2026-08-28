"use client";

import { Suspense } from "react";

import { SogpJourneyPage } from "./sogp-journey-page";
import { SogpDashboardSkeleton } from "./sogp-dashboard-skeleton";
import { SogpErrorBoundary } from "./sogp-error-boundary";

export function SogpDashboardBoundary() {
  return (
    <SogpErrorBoundary>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <SogpJourneyPage />
      </Suspense>
    </SogpErrorBoundary>
  );
}
