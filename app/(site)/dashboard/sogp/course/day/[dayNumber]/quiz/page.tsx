import { SogpErrorBoundary } from "@/components/sogp/sogp-error-boundary";
import { SogpQuiz } from "@/components/sogp/sogp-quiz";

export default async function SogpQuizPage({ params }: { params: Promise<{ dayNumber: string }> }) {
  const { dayNumber } = await params;
  return <SogpErrorBoundary><SogpQuiz dayNumber={Number(dayNumber)}/></SogpErrorBoundary>;
}
