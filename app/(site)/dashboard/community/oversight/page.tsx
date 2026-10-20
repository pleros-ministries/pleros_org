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
 * the groups led by the people they lead and, for the Pastor and branch
 * pastors, every other group in view. `?under=` opens one person's groups.
 */
export default async function OversightPage({ searchParams }: { searchParams: Promise<{ under?: string }> }) {
  const [session, { under }] = await Promise.all([getAppSession(), searchParams]);
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight");
  const data = await getGroupOversight(session.user.id, { under });
  if (!data) redirect(under ? "/dashboard/community/oversight" : "/dashboard/community");
  const updates = await getOversightUpdates(session.user.id, data);
  return <OversightStructure data={data} updates={updates.filter(update => !update.done).length} />;
}
