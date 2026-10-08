import { redirect } from "next/navigation";

import { LeaderReportView } from "@/components/community/leader-report";
import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import { isDateKey } from "@/lib/community/ministry-report";
import { managesAnyUnit, managesUnit } from "@/lib/community/permissions";
import { listOpenFlags } from "@/lib/db/queries/community-posts";
import { getLeaderReport } from "@/lib/db/queries/community-reports";
import { listUnits } from "@/lib/db/queries/community-units";
import { getMinistryDay } from "@/lib/db/queries/ministry-activities";
import { listContactsForStaff } from "@/lib/db/queries/outreach-contacts";
import { lagosToday, shiftDate } from "@/lib/sogp/daily-date";

export default async function CommunityLeaderRoute({
  searchParams,
}: {
  searchParams: Promise<{ unitId?: string; date?: string }>;
}) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/leader");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");
  if (!managesAnyUnit(ctx)) redirect("/dashboard/community");

  // Admins can open any unit; a pastor the regions assigned to them; a member
  // leader their own.
  const units = await listUnits();
  const manageable = units.filter((unit) => managesUnit(ctx, unit.id));

  const { unitId: requested, date } = await searchParams;
  const requestedId = Number(requested);
  const targetUnitId =
    manageable.find((unit) => unit.id === requestedId)?.id ??
    manageable.find((unit) => unit.id === ctx.unit?.id)?.id ??
    manageable[0]?.id ??
    null;
  if (!targetUnitId) redirect("/dashboard/community");

  // Ministry reports carry full names and notes, so they are for the pastor
  // assigned to this group and admins — not a member leader.
  const seesMinistry =
    ctx.isAdmin || ctx.managedUnitIds.includes(targetUnitId);
  const today = lagosToday();
  const ministryDate = isDateKey(date) && date <= today ? date : today;

  const [report, flags, ministryRows, outreach] = await Promise.all([
    getLeaderReport(targetUnitId),
    listOpenFlags(ctx, { unitId: targetUnitId }),
    seesMinistry
      ? getMinistryDay({ dateKey: ministryDate, unitId: targetUnitId })
      : Promise.resolve(null),
    // People this group's members met in the last 90 days, for follow-up.
    seesMinistry
      ? listContactsForStaff({
          fromKey: shiftDate(today, -89),
          toKey: today,
          unitId: targetUnitId,
          limit: 300,
        })
      : Promise.resolve(null),
  ]);
  if (!report) redirect("/dashboard/community");

  return (
    <LeaderReportView
      report={report}
      flags={flags}
      ministry={
        ministryRows
          ? {
              today,
              dateKey: ministryDate,
              memberCount: ministryRows.length,
              rows: ministryRows.flatMap((row) =>
                row.totals
                  ? [
                      {
                        userId: row.userId,
                        name: row.name,
                        activities: row.activities,
                        totals: row.totals,
                      },
                    ]
                  : [],
              ),
            }
          : null
      }
      outreach={outreach}
      unitOptions={manageable.map((u) => ({ id: u.id, name: u.name }))}
      today={today}
      viewer={{ userId: ctx.userId, isAdmin: ctx.isAdmin }}
    />
  );
}
