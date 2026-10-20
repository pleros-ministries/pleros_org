import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OversightReports } from "@/components/dashboard/church/group-oversight-view";
import { getAppSession } from "@/lib/app-session";
import { reportRemindersEnabled } from "@/lib/db/queries/daily-report-preferences";
import { getGroupOversight } from "@/lib/db/queries/group-oversight";
import { getOversightUpdates } from "@/lib/db/queries/oversight-updates";
import { lagosToday, shiftDate } from "@/lib/sogp/daily-date";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Reports · Oversight" };

/** Oversight's Reports tab: one day's reports across the viewer's groups and the groups under them. */
export default async function OversightReportsPage({ searchParams }: { searchParams: Promise<{ under?: string; day?: string }> }) {
  const [session, params] = await Promise.all([getAppSession(), searchParams]);
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/reports");
  const data = await getGroupOversight(session.user.id, { under: params.under, day: params.day });
  if (!data) redirect("/dashboard/community");
  const updates = await getOversightUpdates(session.user.id, data);
  const today = lagosToday();
  // Today and the four days before it; report writes reach back seven days, so a missed day can still be chased.
  const days = [0, -1, -2, -3, -4].map(offset => shiftDate(today, offset));
  if (!days.includes(data.day)) days.push(data.day);
  return <OversightReports data={data} updates={updates.filter(update => !update.done).length} days={days} today={today} remind={reportRemindersEnabled()} />;
}
