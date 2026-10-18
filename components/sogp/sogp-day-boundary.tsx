"use client";

import { Suspense } from "react";

import { SogpDayView } from "./sogp-day-view";
import { SogpErrorBoundary } from "./sogp-error-boundary";
import { SogpLessonSkeleton } from "./sogp-lesson-skeleton";

export function SogpDayBoundary({ dayNumber }: { dayNumber: number }) {
  return (
    <SogpErrorBoundary>
      <Suspense fallback={<SogpLessonSkeleton />}>
        <SogpDayView dayNumber={dayNumber} />
      </Suspense>
    </SogpErrorBoundary>
  );
}
