import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OversightOtherGroups } from "@/components/dashboard/church/group-oversight-view";
import { getAppSession } from "@/lib/app-session";
import { getGroupOversight } from "@/lib/db/queries/group-oversight";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Every other group" };

/**
 * Every other group in the Pastor's view (or the other groups in a branch
 * pastor's branches), moved off Structure so it stays short (Pastor, 21 October).
 */
export default async function OversightOtherGroupsPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/other-groups");
  const data = await getGroupOversight(session.user.id, {});
  if (!data) redirect("/dashboard/community");
  // Only the Pastor and branch pastors have a wider view.
  if (data.role === "leader") redirect("/dashboard/community/oversight");
  return <OversightOtherGroups data={data} />;
}
