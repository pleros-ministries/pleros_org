import { BrowserSuspense } from "@/components/sogp/browser-suspense";
import { SogpErrorBoundary } from "@/components/sogp/sogp-error-boundary";
import { SogpQuizSkeleton } from "@/components/sogp/sogp-lesson-skeleton";
import { SogpQuiz } from "@/components/sogp/sogp-quiz";

export default async function SogpQuizPage({ params }: { params: Promise<{ dayNumber: string }> }) {
  const { dayNumber } = await params;
  return <SogpErrorBoundary><BrowserSuspense fallback={<SogpQuizSkeleton />}><SogpQuiz dayNumber={Number(dayNumber)}/></BrowserSuspense></SogpErrorBoundary>;
}
