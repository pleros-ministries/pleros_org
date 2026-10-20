import { redirect } from "next/navigation";

// Reads the session or params on every request (Cache Components).
export const instant = false;

// The response lives in the lesson's Response tab now (user, 18 October).
export default async function SogpResponsePage({ params }: { params: Promise<{ dayNumber: string }> }) {
  const { dayNumber } = await params;
  redirect(`/dashboard/sogp/course/day/${encodeURIComponent(dayNumber)}?tab=response`);
}
