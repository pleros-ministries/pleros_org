import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MonthView } from "@/components/dashboard/month/month-view";
import { getAppSession } from "@/lib/app-session";
import { getMonthCalendarData } from "@/lib/dashboard/month-data";
import { getSogpDashboardData } from "@/lib/db/queries/sogp";
import { getOwnSogpLearning } from "@/lib/db/queries/sogp-learning";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "This month" };

/** The shared month (Pastor, 25 November 2026): what you did each day, and your plan to the month's end. */
export default async function SogpMonthPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/month");
  const userId = session.user.id;
  const [course, state] = await Promise.all([getSogpDashboardData(userId), getOwnSogpLearning(userId).catch(() => null)]);
  if (!course) redirect("/sogp/enrol");
  const data = await getMonthCalendarData(userId, { state, course });
  return <MonthView data={data} />;
}
