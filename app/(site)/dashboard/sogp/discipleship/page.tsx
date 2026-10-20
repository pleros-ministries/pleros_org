import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/app-session";
import { getDiscipleshipDashboard } from "@/lib/db/queries/sogp-discipleship";

// Reads the session on every request (Cache Components).
export const instant = false;

/**
 * My disciples is retired: each discipleship group's page in Community now
 * hosts its disciples, check-ins and prayer. Old links (notifications,
 * emails, bookmarks) land on the right group. Loading the dashboard still
 * creates the learner's first group lazily, as before.
 */
export default async function SogpDiscipleshipPage({ searchParams }: { searchParams: Promise<{ group?: string; view?: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/discipleship");

  const { group } = await searchParams;
  const requestedGroupId = group && /^\d{1,9}$/.test(group) ? Number(group) : null;
  const data = await getDiscipleshipDashboard(session.user.id, requestedGroupId);
  if (!data) redirect("/sogp/enrol");

  // A learner with a discipler and no disciples of their own starts on the group they are in.
  const memberFirst = requestedGroupId === null && data.myDiscipler && data.ledGroups.every(led => led.discipleCount === 0);
  redirect(memberFirst ? "/dashboard/community/discipleship" : `/dashboard/community/discipleship/${data.selectedGroup.id}`);
}
