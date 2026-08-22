import { SogpDayBoundary } from "@/components/sogp/sogp-day-boundary";

export default async function SogpDayPage({ params }: { params: Promise<{ dayNumber: string }> }) {
  const { dayNumber } = await params;
  return <SogpDayBoundary dayNumber={Number(dayNumber)} />;
}
