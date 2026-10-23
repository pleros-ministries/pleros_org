import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OversightStructure } from "@/components/dashboard/church/group-oversight-view";
import { getAppSession } from "@/lib/app-session";
import { getGroupOversight } from "@/lib/db/queries/group-oversight";
import { getOversightUpdates } from "@/lib/db/queries/oversight-updates";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Oversight" };

/**
 * Oversight's Structure tab (Pastor, 20 October): the groups the viewer leads,
 * the groups under them and, for the Pastor and branch pastors, every other
 * group in view. `?under=` opens one person's groups; with `&group=`, one group.
 */
export default async function OversightPage({ searchParams }: { searchParams: Promise<{ under?: string; group?: string }> }) {
  const [session, { under, group }] = await Promise.all([getAppSession(), searchParams]);
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight");
  const data = await getGroupOversight(session.user.id, { under });
  if (!data) redirect(under ? "/dashboard/community/oversight" : "/dashboard/community");
  const updates = await getOversightUpdates(session.user.id, data);
  // `?group=` opens one of that leader's groups on its own (Pastor, 22 October).
  const groupId = group && /^\d{1,9}$/.test(group) ? Number(group) : null;
  return <OversightStructure data={data} updates={updates.filter(update => !update.done).length} groupId={groupId} />;
}
