import { SogpErrorBoundary } from "@/components/sogp/sogp-error-boundary";
import { SogpWrittenResponse } from "@/components/sogp/sogp-written-response";

export default async function SogpResponsePage({ params }: { params: Promise<{ dayNumber: string }> }) {
  const { dayNumber } = await params;
  return <SogpErrorBoundary><SogpWrittenResponse dayNumber={Number(dayNumber)}/></SogpErrorBoundary>;
}
