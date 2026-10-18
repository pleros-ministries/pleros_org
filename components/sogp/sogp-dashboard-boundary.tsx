"use client";

import { BrowserSuspense } from "./browser-suspense";
import { SogpJourneyPage } from "./sogp-journey-page";
import { SogpDashboardSkeleton } from "./sogp-dashboard-skeleton";
import { SogpErrorBoundary } from "./sogp-error-boundary";

export function SogpDashboardBoundary() {
  return (
    <SogpErrorBoundary>
      <BrowserSuspense fallback={<SogpDashboardSkeleton />}>
        <SogpJourneyPage />
      </BrowserSuspense>
    </SogpErrorBoundary>
  );
}
