import { BrowserSuspense } from "@/components/sogp/browser-suspense";
import { SogpErrorBoundary } from "@/components/sogp/sogp-error-boundary";
import { SogpResponseSkeleton } from "@/components/sogp/sogp-lesson-skeleton";
import { SogpWrittenResponse } from "@/components/sogp/sogp-written-response";

export default async function SogpResponsePage({ params }: { params: Promise<{ dayNumber: string }> }) {
  const { dayNumber } = await params;
  return <SogpErrorBoundary><BrowserSuspense fallback={<SogpResponseSkeleton />}><SogpWrittenResponse dayNumber={Number(dayNumber)}/></BrowserSuspense></SogpErrorBoundary>;
}
