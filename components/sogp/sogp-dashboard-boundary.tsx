"use client";

import { Suspense } from "react";

import { SogpDashboard } from "./sogp-dashboard";
import { SogpDashboardSkeleton } from "./sogp-dashboard-skeleton";
import { SogpErrorBoundary } from "./sogp-error-boundary";

export function SogpDashboardBoundary() {
  return (
    <SogpErrorBoundary>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <SogpDashboard />
      </Suspense>
    </SogpErrorBoundary>
  );
}
