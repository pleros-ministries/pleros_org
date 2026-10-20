import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NaturalAssignment } from "@/components/community/report/natural-assignment";
import { getAppSession } from "@/lib/app-session";
import { getCommunityContext } from "@/lib/community/context";
import { isDateKey, reportableDateKeys } from "@/lib/community/ministry-report";
import { canAccessReporting } from "@/lib/community/reporting-access";
import { dateKeyLabel } from "@/lib/community/time";
import { getNaturalAssignment } from "@/lib/db/queries/natural-assignment";
import { lagosToday } from "@/lib/sogp/daily-date";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Natural assignment" };

/** The optional natural assignment report for one day, under My reports' Other reports. */
export default async function NaturalAssignmentPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const [session, ctx, { day }] = await Promise.all([getAppSession(), getCommunityContext(), searchParams]);
  if (!session) redirect("/login?returnTo=/dashboard/community/report/assignment");
  if (!ctx || !(await canAccessReporting(ctx))) redirect("/sogp/enrol");
  const today = lagosToday();
  const selected = isDateKey(day) && day <= today ? day : today;
  const assignment = await getNaturalAssignment(ctx.userId, selected);
  if (!assignment) redirect(`/dashboard/community/report${selected === today ? "" : `?day=${selected}`}`);
  // Evening, or a day already reviewed, opens on End of day; otherwise on the plan.
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Africa/Lagos" }).format(new Date()));
  const reviewed = assignment.goals.some(goal => goal.outcome);
  const stage = reviewed || selected < today || (hour >= 17 && assignment.goals.length) ? "review" : "plan";
  return <NaturalAssignment key={selected} initial={assignment} writable={reportableDateKeys(today).includes(selected)} initialStage={stage}
    dateLabel={`${selected === today ? "Today · " : ""}${dateKeyLabel(selected)}`} />;
}
