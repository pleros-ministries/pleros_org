"use client";

import { BrowserSuspense } from "./browser-suspense";
import { SogpDayView } from "./sogp-day-view";
import { SogpErrorBoundary } from "./sogp-error-boundary";
import { SogpLessonSkeleton } from "./sogp-lesson-skeleton";

export function SogpDayBoundary({ dayNumber }: { dayNumber: number }) {
  return (
    <SogpErrorBoundary>
      <BrowserSuspense fallback={<SogpLessonSkeleton />}>
        <SogpDayView dayNumber={dayNumber} />
      </BrowserSuspense>
    </SogpErrorBoundary>
  );
}
