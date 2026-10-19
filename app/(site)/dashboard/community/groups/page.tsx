import { redirect } from "next/navigation";

import {
  GroupsDirectory,
  type LocationGroupLink,
} from "@/components/community/groups/groups-directory";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { listGroupDirectory } from "@/lib/db/queries/community-groups";
import { getCommunityHomeDiscipleship } from "@/lib/db/queries/community-discipleship";
import { listUnitNames } from "@/lib/db/queries/community-units";
import { listPrivateMinistryContacts } from "@/lib/db/queries/private-ministry-contacts";
import { reportingV3SchemaReady } from "@/lib/db/queries/reporting-v3-gate";
import { listOwnEnrollees } from "@/lib/db/queries/sogp-follow-up-routes";

export default async function CommunityGroupsRoute({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const { create } = await searchParams;
  // Session and context load together instead of one roundtrip after the other.
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect("/login?returnTo=/dashboard/community/groups");
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  // Location groups the viewer belongs to or looks after as assigned pastor.
  const managedIds = ctx.managedUnitIds.filter((id) => id !== ctx.unit?.id);
  const [groups, managedUnits, discipleship, contacts, enrollees] = await Promise.all([
    listGroupDirectory(ctx.userId),
    listUnitNames(managedIds),
    ctx.enrollmentId != null ? getCommunityHomeDiscipleship(ctx.userId).catch(() => null) : Promise.resolve(null),
    // People on their way into the viewer's groups (optional rows).
    reportingV3SchemaReady() ? listPrivateMinistryContacts(ctx.userId).then(rows => rows.length).catch(() => null) : Promise.resolve(null),
    ctx.enrollmentId != null ? listOwnEnrollees(ctx.userId).catch(() => null) : Promise.resolve(null),
  ]);
  // Old "New group" links (`?create=1`) open the oversight-group form.
  if (create === "1") {
    const firstLed = discipleship?.leading.find(group => !group.paused);
    redirect(firstLed ? `/dashboard/community/discipleship/${firstLed.groupId}?panel=create` : "/dashboard/sogp/discipleship");
  }
  const locationGroups: LocationGroupLink[] = [
    ...(ctx.unit
      ? [{ id: ctx.unit.id, name: ctx.unit.name, relation: "member" as const }]
      : []),
    ...managedUnits.map((unit) => ({ ...unit, relation: "manager" as const })),
  ];

  return (
    <GroupsDirectory
      groups={groups}
      locationGroups={locationGroups}
      discipleship={discipleship ? { joined: discipleship.joined, leading: discipleship.leading.filter((group) => !group.paused) } : null}
      people={{ contacts, enrollees: enrollees ? { total: enrollees.length, free: enrollees.filter(row => !row.group).length } : null }}
    />
  );
}
