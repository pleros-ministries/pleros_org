import { redirect } from "next/navigation";

import { SogpDashboardBoundary } from "@/components/sogp/sogp-dashboard-boundary";
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
      <SogpDashboardBoundary />
    </>
  );
}
