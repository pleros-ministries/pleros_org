import { redirect } from "next/navigation";

import { DiscipleshipInviteBanner } from "@/components/sogp/discipleship-invite-banner";
import { LearningBoundary } from "@/components/sogp/learning/learning-boundary";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";
import { SogpJoinCohortBanner } from "@/components/sogp/sogp-join-cohort-banner";
import { getAppSession } from "@/lib/app-session";
import {
  getOpenSogpCohort,
  getSogpEnrollmentsWithCohortByUserId,
} from "@/lib/db/queries/sogp";
import { canOfferJoinAnotherCohort } from "@/lib/sogp/status";

export default async function SogpDashboardPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp");

  const rows = await getSogpEnrollmentsWithCohortByUserId(session.user.id);
  if (rows.length === 0) redirect("/sogp/enrol");

  const openCohort = await getOpenSogpCohort();
  const canJoinAnotherCohort = canOfferJoinAnotherCohort(rows, openCohort?.id ?? null);
  const learning = await getOwnLearningView(session.user.id);
  if (!learning) redirect("/sogp/enrol");

  return (
    <>
      {canJoinAnotherCohort && openCohort ? (
        <SogpJoinCohortBanner
          cohort={{
            id: openCohort.id,
            title: openCohort.title,
            startsAt: openCohort.startsAt.toISOString(),
          }}
        />
      ) : null}
      <DiscipleshipInviteBanner enrollmentId={rows[0]!.enrollment.id} />
      <LearningBoundary initialData={learning} />
    </>
  );
}
