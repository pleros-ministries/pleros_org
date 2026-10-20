import { SogpDayBoundary } from "@/components/sogp/sogp-day-boundary";

// Reads the session or params on every request (Cache Components).
export const instant = false;

export default async function SogpDayPage({ params }: { params: Promise<{ dayNumber: string }> }) {
  const { dayNumber } = await params;
  return <SogpDayBoundary dayNumber={Number(dayNumber)} />;
}
