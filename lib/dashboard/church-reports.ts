import "server-only";

import { CHURCH_ROLE_LABELS, type ChurchRole } from "@/lib/church/permissions";
import { dateKeyLabel } from "@/lib/community/time";
import { getChurchRosterDay } from "@/lib/db/queries/church-reports";
import { reportRemindersEnabled } from "@/lib/db/queries/daily-report-preferences";
import { lagosToday } from "@/lib/sogp/daily-date";

/**
 * Church reports for one viewer and day: shared by Oversight's Reports tab and
 * the standalone church reports page that unit leaders keep. Status only.
 */
export async function loadChurchReports(viewerId: string, role: string | null, supervisor?: string) {
  const today = lagosToday();
  const roster = await getChurchRosterDay(viewerId, today);
  const scoped = supervisor ? roster.find(row => row.userId === supervisor) : null;
  const rows = roster.filter(row => row.userId !== viewerId && (!scoped || row.supervisorId === scoped.userId));
  const scope = scoped ? `${scoped.name}’s direct reports` : role === "pastor" ? "All branches" : role === "unit_leader" ? "Your unit" : rows[0]?.branchName ? `${rows[0].branchName} branch` : "Your oversight";
  return {
    roster,
    scoped,
    props: {
      day: today,
      dayLabel: dateKeyLabel(today),
      scope,
      remindersEnabled: reportRemindersEnabled(),
      rows: rows.map(row => ({ userId: row.userId, name: row.name, roleLabel: CHURCH_ROLE_LABELS[row.role as ChurchRole], group: row.unitName ?? row.branchName ?? "Direct report", statuses: row.statuses })),
    },
  };
}
