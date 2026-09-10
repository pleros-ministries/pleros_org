import { count } from "drizzle-orm";

import { AdminCommunityPage } from "@/components/community/admin-community-page";
import { requireAdmin } from "@/lib/auth/require-role";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { listUnits } from "@/lib/db/queries/community-units";
import { listGlobalPosts, listOpenFlags } from "@/lib/db/queries/community-posts";
import { getCommunityContext } from "@/lib/community/context";

export default async function AdminCommunityRoute() {
  await requireAdmin();
  const ctx = await getCommunityContext();

  const [units, enrolments, members, posts, flags] = await Promise.all([
    listUnits(),
    db.select({ n: count() }).from(schema.sogpEnrollments),
    db.select({ n: count() }).from(schema.unitMembers),
    listGlobalPosts(),
    ctx ? listOpenFlags(ctx) : Promise.resolve([]),
  ]);

  return (
    <AdminCommunityPage
      units={units}
      posts={posts}
      flags={flags}
      enrolmentCount={enrolments[0]?.n ?? 0}
      memberCount={members[0]?.n ?? 0}
    />
  );
}
