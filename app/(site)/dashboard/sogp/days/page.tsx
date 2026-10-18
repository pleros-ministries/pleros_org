import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SogpDaysView } from "@/components/sogp/learning/sogp-days-view";
import { getAppSession } from "@/lib/app-session";
import { getActiveSogpJourney } from "@/lib/db/queries/sogp-journey";
import { lagosToday } from "@/lib/sogp/daily-date";
import { buildSogpDays } from "@/lib/sogp/sogp-days";

export const metadata: Metadata = { title: "Your SOGP days" };

export default async function SogpDaysPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/days");
  const journey = await getActiveSogpJourney(session.user.id).catch(() => null);
  const plan = journey ? buildSogpDays(journey.days, lagosToday()) : null;
  if (!plan?.days.length) redirect("/dashboard/sogp/traditional");
  return <SogpDaysView plan={plan} />;
}
