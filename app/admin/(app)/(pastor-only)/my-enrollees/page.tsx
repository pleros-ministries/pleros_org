import { PastorFollowupView } from "@/components/ppc/pastor-followup-view";
import { requirePastorOrAdmin } from "@/lib/auth/require-role";
import { hasAdminAccess } from "@/lib/app-role";
import { getPastorCohorts, getPastorEnrollees, listPastors } from "@/lib/db/queries/pastor-followups";

export default async function PastorMyEnrolleesPage({
  searchParams,
}: {
  searchParams: Promise<{ pastorId?: string }>;
}) {
  const session = await requirePastorOrAdmin();
  const isAdmin = hasAdminAccess(session.user.role);

  const { pastorId: requested } = await searchParams;
  const [allPastors] = await Promise.all([
    isAdmin ? listPastors() : Promise.resolve([]),
  ]);

  // Default to the viewer's own queue — this also covers an admin who
  // doubles as a pastor. `?pastorId=` lets an admin preview anyone else's.
  const targetPastorId = isAdmin && requested ? requested : session.user.id;

  const [enrollees, cohorts] = await Promise.all([
    getPastorEnrollees(targetPastorId),
    getPastorCohorts(targetPastorId),
  ]);

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
