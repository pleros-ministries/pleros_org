import { PastorFollowupView } from "@/components/ppc/pastor-followup-view";
import { requirePastorOrAdmin } from "@/lib/auth/require-role";
import { hasAdminAccess } from "@/lib/app-role";
import {
  getAllCohorts,
  getAllSogpEnrollees,
  getPastorCohorts,
  getPastorEnrollees,
  listPastors,
} from "@/lib/db/queries/pastor-followups";
import { ALL_PASTORS } from "@/lib/sogp/daily-participation";

export default async function PastorMyEnrolleesPage({
  searchParams,
}: {
  searchParams: Promise<{ pastorId?: string }>;
}) {
  const session = await requirePastorOrAdmin();
  const isAdmin = hasAdminAccess(session.user.role);

  const { pastorId: requested } = await searchParams;
  const allPastors = isAdmin ? await listPastors() : [];

  // Admins default to every enrollee; `?pastorId=` narrows to one pastor's
  // queue (including their own, for an admin who doubles as a pastor).
  // Pastors always see their own queue.
  const targetPastorId = isAdmin ? (requested || ALL_PASTORS) : session.user.id;
  const showAll = targetPastorId === ALL_PASTORS;

  const [enrollees, cohorts] = await Promise.all(
    showAll
      ? [getAllSogpEnrollees(), getAllCohorts()]
      : [getPastorEnrollees(targetPastorId), getPastorCohorts(targetPastorId)],
  );

  return (
    <PastorFollowupView
      enrollees={enrollees}
      cohorts={cohorts}
      isAdmin={isAdmin}
      pastorOptions={allPastors.map((p) => ({ id: p.id, name: p.name }))}
      selectedPastorId={targetPastorId}
    />
  );
}
