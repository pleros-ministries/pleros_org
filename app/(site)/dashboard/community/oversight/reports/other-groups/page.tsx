import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OversightOtherReports } from "@/components/dashboard/church/group-oversight-view";
import { getAppSession } from "@/lib/app-session";
import { getGroupOversight } from "@/lib/db/queries/group-oversight";
import { lagosToday, shiftDate } from "@/lib/sogp/daily-date";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Every other group · Reports" };

/** One day's reports for every other group in the Pastor's or a branch pastor's view (Pastor, 21 October). */
export default async function OversightOtherReportsPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const [session, params] = await Promise.all([getAppSession(), searchParams]);
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/reports/other-groups");
  const data = await getGroupOversight(session.user.id, { day: params.day });
  if (!data) redirect("/dashboard/community");
  // Only the Pastor and branch pastors have a wider view.
  if (data.role === "leader") redirect("/dashboard/community/oversight/reports");
  const today = lagosToday();
  const days = [0, -1, -2, -3, -4].map(offset => shiftDate(today, offset));
  if (!days.includes(data.day)) days.push(data.day);
  return <OversightOtherReports data={data} days={days} today={today} />;
}
