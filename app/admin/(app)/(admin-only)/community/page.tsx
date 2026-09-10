import { count } from "drizzle-orm";

import { AdminCommunityPage } from "@/components/community/admin-community-page";
import { requireAdmin } from "@/lib/auth/require-role";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { listUnits } from "@/lib/db/queries/community-units";

export default async function AdminCommunityRoute() {
  await requireAdmin();

  const [units, enrolments, members] = await Promise.all([
    listUnits(),
    db.select({ n: count() }).from(schema.sogpEnrollments),
    db.select({ n: count() }).from(schema.unitMembers),
  ]);

  return (
    <AdminCommunityPage
      units={units}
      enrolmentCount={enrolments[0]?.n ?? 0}
      memberCount={members[0]?.n ?? 0}
    />
  );
}
