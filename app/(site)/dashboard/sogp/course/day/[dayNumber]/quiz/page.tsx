import { redirect } from "next/navigation";

// Reads the session or params on every request (Cache Components).
export const instant = false;

// The quiz lives in the lesson's Quiz tab now (user, 18 October).
export default async function SogpQuizPage({ params }: { params: Promise<{ dayNumber: string }> }) {
  const { dayNumber } = await params;
  redirect(`/dashboard/sogp/course/day/${encodeURIComponent(dayNumber)}?tab=quiz`);
}
