import { redirect } from "next/navigation";

// The response lives in the lesson's Response tab now (user, 18 October).
export default async function SogpResponsePage({ params }: { params: Promise<{ dayNumber: string }> }) {
  const { dayNumber } = await params;
  redirect(`/dashboard/sogp/course/day/${encodeURIComponent(dayNumber)}?tab=response`);
}
