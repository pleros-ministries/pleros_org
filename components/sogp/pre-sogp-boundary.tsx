"use client";

import { Suspense } from "react";

import type { PreSogpJourneyData } from "@/lib/db/queries/sogp-journey";

import { PreSogpPage } from "./pre-sogp-page";
import { SogpDashboardSkeleton } from "./sogp-dashboard-skeleton";
import { SogpErrorBoundary } from "./sogp-error-boundary";

export function PreSogpBoundary({
  initialData,
}: {
  initialData?: PreSogpJourneyData;
}) {
  return (
    <SogpErrorBoundary>
      <Suspense fallback={<SogpDashboardSkeleton />}>
        <PreSogpPage initialData={initialData} />
      </Suspense>
    </SogpErrorBoundary>
  );
}
