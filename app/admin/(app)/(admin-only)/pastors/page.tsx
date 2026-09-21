import { AdminPastorsPage } from "@/components/ppc/admin-pastors-page";
import { requireAdmin } from "@/lib/auth/require-role";
import {
  listAdminsForPastorFlag,
  listPastors,
  listRegionsWithPastors,
  listSogpEnrollees,
} from "@/lib/db/queries/pastor-followups";

export default async function AdminPastorsRoute() {
  await requireAdmin();

  const [pastors, enrollees, admins, regions] = await Promise.all([
    listPastors(),
    listSogpEnrollees({ limit: 200 }),
    listAdminsForPastorFlag(),
    listRegionsWithPastors(),
  ]);

  return (
    <AdminPastorsPage
      pastors={pastors}
      enrollees={enrollees}
      admins={admins}
      regions={regions}
    />
  );
}
