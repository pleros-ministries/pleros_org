import { redirect } from "next/navigation";

import { LeaderReportView } from "@/components/community/leader-report";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { getLeaderReport } from "@/lib/db/queries/community-reports";
import { listUnits } from "@/lib/db/queries/community-units";

export default async function CommunityLeaderRoute({
  searchParams,
}: {
  searchParams: Promise<{ unitId?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/leader");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");
  if (!ctx.isUnitLeader && !ctx.isAdmin) redirect("/dashboard/community");

  const { unitId: requested } = await searchParams;
  let targetUnitId = ctx.unit?.id ?? null;
  if (ctx.isAdmin && requested && Number.isInteger(Number(requested))) {
    targetUnitId = Number(requested);
  }
  if (!targetUnitId) {
    // Admin without a unit — send them to the first unit.
    const units = await listUnits();
    targetUnitId = units[0]?.id ?? null;
  }
  if (!targetUnitId) redirect("/dashboard/community");

  const [report, adminUnits] = await Promise.all([
    getLeaderReport(targetUnitId),
    ctx.isAdmin ? listUnits() : Promise.resolve([]),
  ]);
  if (!report) redirect("/dashboard/community");

  return (
    <LeaderReportView
      report={report}
      isAdmin={ctx.isAdmin}
      unitOptions={adminUnits.map((u) => ({ id: u.id, name: u.name }))}
    />
  );
}
