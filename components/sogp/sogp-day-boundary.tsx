"use client";

import { Suspense } from "react";

import { SogpDashboardSkeleton } from "./sogp-dashboard-skeleton";
import { SogpDayView } from "./sogp-day-view";
import { SogpErrorBoundary } from "./sogp-error-boundary";

export function SogpDayBoundary({ dayNumber }: { dayNumber: number }) {
  return (
    <SogpErrorBoundary>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <SogpDayView dayNumber={dayNumber} />
      </Suspense>
    </SogpErrorBoundary>
  );
}
