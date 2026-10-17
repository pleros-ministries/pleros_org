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

export default async function CommunityGroupsRoute({ searchParams }: { searchParams: Promise<{ create?: string }> }) {
  const { create } = await searchParams;
  // Session and context load together instead of one roundtrip after the other.
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect("/login?returnTo=/dashboard/community/groups");
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  // Location groups the viewer belongs to or looks after as assigned pastor.
  const managedIds = ctx.managedUnitIds.filter((id) => id !== ctx.unit?.id);
  const [groups, managedUnits, discipleship] = await Promise.all([
    listGroupDirectory(ctx.userId),
    listUnitNames(managedIds),
    ctx.enrollmentId != null ? getCommunityHomeDiscipleship(ctx.userId).catch(() => null) : Promise.resolve(null),
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
      discipleship={discipleship ? { joined: discipleship.joined, leading: discipleship.leading.filter((group) => !group.paused) } : null}
      canCreate={!ctx.postingBlocked}
      startCreating={create === "1" && !ctx.postingBlocked}
    />
  );
}
