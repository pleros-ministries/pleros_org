import { count } from "drizzle-orm";

import { AdminCommunityPage } from "@/components/community/admin-community-page";
import { AdminDiscipleshipSection } from "@/components/community/admin-discipleship-section";
import { AdminGroupsSection } from "@/components/community/admin-groups-section";
import { requireAdmin } from "@/lib/auth/require-role";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { listGroupsForAdmin } from "@/lib/db/queries/community-groups";
import { listUnits } from "@/lib/db/queries/community-units";
import { listGlobalPosts, listOpenFlags } from "@/lib/db/queries/community-posts";
import { listRestrictedMembers } from "@/lib/db/queries/community-restrictions";
import { getDiscipleshipAdminOverview } from "@/lib/db/queries/sogp-discipleship";
import { getCommunityContext } from "@/lib/community/context";

export default async function AdminCommunityRoute() {
  await requireAdmin();
  const ctx = await getCommunityContext();

  const [
    units,
    enrolments,
    members,
    posts,
    flags,
    discipleship,
    restricted,
    memberGroups,
  ] = await Promise.all([
      listUnits(),
      db.select({ n: count() }).from(schema.sogpEnrollments),
      db.select({ n: count() }).from(schema.unitMembers),
      listGlobalPosts(),
      ctx ? listOpenFlags(ctx) : Promise.resolve([]),
      getDiscipleshipAdminOverview(),
      listRestrictedMembers(),
      listGroupsForAdmin(),
    ]);

  return (
    <div className="grid gap-4">
      <AdminCommunityPage
        units={units}
        posts={posts}
        flags={flags}
        restricted={restricted}
        enrolmentCount={enrolments[0]?.n ?? 0}
        memberCount={members[0]?.n ?? 0}
      />
      <AdminGroupsSection groups={memberGroups} />
      <AdminDiscipleshipSection overview={discipleship} />
    </div>
  );
}
