import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OversightUpdates } from "@/components/dashboard/church/group-oversight-view";
import { getAppSession } from "@/lib/app-session";
import { getGroupOversight } from "@/lib/db/queries/group-oversight";
import { getOversightUpdates } from "@/lib/db/queries/oversight-updates";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Updates · Oversight" };

/** Oversight's Updates tab: what needs the viewer, oldest first, ticked off with Done. */
export default async function OversightUpdatesPage({ searchParams }: { searchParams: Promise<{ under?: string }> }) {
  const [session, { under }] = await Promise.all([getAppSession(), searchParams]);
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/updates");
  const data = await getGroupOversight(session.user.id, { under });
  if (!data) redirect("/dashboard/community");
  return <OversightUpdates data={data} updates={await getOversightUpdates(session.user.id, data)} />;
}
