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
import { traditionalDateHref } from "@/lib/sogp/learning-view";

export default async function SogpDashboardPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp");
  const dated = traditionalDateHref((await searchParams).date);
  if (dated) redirect(dated);

  // Independent reads run together; guard order below preserves redirect priority.
  const [rows, openCohort, learning] = await Promise.all([
    getSogpEnrollmentsWithCohortByUserId(session.user.id),
    getOpenSogpCohort(),
    getOwnLearningView(session.user.id),
  ]);
  if (rows.length === 0) redirect("/sogp/enrol");

  const canJoinAnotherCohort = canOfferJoinAnotherCohort(rows, openCohort?.id ?? null);
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
