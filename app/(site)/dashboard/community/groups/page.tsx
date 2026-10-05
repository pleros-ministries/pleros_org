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
import { listUnitNames } from "@/lib/db/queries/community-units";

export default async function CommunityGroupsRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/groups");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  // Location groups the viewer belongs to or looks after as assigned pastor.
  const managedIds = ctx.managedUnitIds.filter((id) => id !== ctx.unit?.id);
  const [groups, managedUnits] = await Promise.all([
    listGroupDirectory(ctx.userId),
    listUnitNames(managedIds),
  ]);
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
      showDiscipleship={ctx.enrollmentId != null}
      canCreate={!ctx.postingBlocked}
    />
  );
}
