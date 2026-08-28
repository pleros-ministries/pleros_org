"use client";

import { Suspense } from "react";

import { PreSogpPage } from "./pre-sogp-page";
import { SogpDashboardSkeleton } from "./sogp-dashboard-skeleton";
import { SogpErrorBoundary } from "./sogp-error-boundary";

export function PreSogpBoundary() {
  return (
    <SogpErrorBoundary>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <PreSogpPage />
      </Suspense>
    </SogpErrorBoundary>
  );
}
