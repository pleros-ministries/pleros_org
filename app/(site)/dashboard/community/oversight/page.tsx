import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OversightOverview } from "@/components/dashboard/church/oversight-view";
import { getAppSession } from "@/lib/app-session";
import { getOversight } from "@/lib/db/queries/oversight";

export const metadata: Metadata = { title: "Oversight" };

/** The Pastor's church or a Branch Pastor's branches. Anyone else goes to their church page. */
export default async function OversightPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight");
  const data = await getOversight(session.user.id);
  if (!data) redirect("/dashboard/church");
  return <OversightOverview data={data} />;
}
