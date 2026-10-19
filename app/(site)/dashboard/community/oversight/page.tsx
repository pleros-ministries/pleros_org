import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GroupOversightOverview } from "@/components/dashboard/church/group-oversight-view";
import { OversightOverview } from "@/components/dashboard/church/oversight-view";
import { getAppSession } from "@/lib/app-session";
import { getGroupOversight } from "@/lib/db/queries/group-oversight";
import { getOversight } from "@/lib/db/queries/oversight";
import { groupOversightEnabled } from "@/lib/db/queries/oversight-tree";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Oversight" };

/**
 * The people under the viewer in the group tree (groups as oversight, 19
 * October), widened to the church or branches for the Pastor and branch
 * pastors. `?under=` opens one person's groups.
 */
export default async function OversightPage({ searchParams }: { searchParams: Promise<{ under?: string }> }) {
  const [session, { under }] = await Promise.all([getAppSession(), searchParams]);
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight");
  if (groupOversightEnabled()) {
    const data = await getGroupOversight(session.user.id, { under });
    if (!data) redirect(under ? "/dashboard/community/oversight" : "/dashboard/community");
    return <GroupOversightOverview data={data} />;
  }
  const data = await getOversight(session.user.id);
  if (!data) redirect("/dashboard/church");
  return <OversightOverview data={data} />;
}
