import { redirect } from "next/navigation";

import { DiscipleshipInviteBanner } from "@/components/sogp/discipleship-invite-banner";
import { LearningBoundary } from "@/components/sogp/learning/learning-boundary";
import { LearningHub } from "@/components/sogp/learning/learning-hub";
import { getLearningHubData } from "@/lib/dashboard/learning-hub";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";
import { SogpJoinCohortBanner } from "@/components/sogp/sogp-join-cohort-banner";
import { getAppSession } from "@/lib/app-session";
import {
  getOpenSogpCohort,
  getSogpEnrollmentsWithCohortByUserId,
} from "@/lib/db/queries/sogp";
import { canOfferJoinAnotherCohort } from "@/lib/sogp/status";
import { traditionalDateHref } from "@/lib/sogp/learning-view";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function SogpDashboardPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp");
  const dated = traditionalDateHref((await searchParams).date);
  if (dated) redirect(dated);

  // Independent reads run together; guard order below preserves redirect priority.
  // The hub starts the moment the learning state arrives, alongside the enrolment reads,
  // and reuses that state (a second state read would queue behind the same learner lock).
  const learningRead = getOwnLearningView(session.user.id);
  const hubRead = learningRead.then(view => view ? getLearningHubData(session.user.id, view.state).catch(() => null) : null);
  const [rows, openCohort, learning, hub] = await Promise.all([
    getSogpEnrollmentsWithCohortByUserId(session.user.id),
    getOpenSogpCohort(),
    learningRead,
    hubRead,
  ]);
  if (rows.length === 0) redirect("/sogp/enrol");

  const canJoinAnotherCohort = canOfferJoinAnotherCohort(rows, openCohort?.id ?? null);
  if (!learning) redirect("/sogp/enrol");
  // A failed hub read falls back to the previous view.

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
      {hub ? <LearningHub hub={hub} learning={learning} /> : <LearningBoundary initialData={learning} />}
    </>
  );
}
