import { redirect } from "next/navigation";

import { SogpCertificatesPage } from "@/components/sogp/sogp-certificates-page";
import { getAppSession } from "@/lib/app-session";
import { getActiveSogpJourneyWithContext } from "@/lib/db/queries/sogp-journey";
import {
  getSogpCertificateShareUrl,
  listSogpCertificatesForUser,
} from "@/lib/db/queries/sogp-week-certificates";
import { getSogpLevel } from "@/lib/sogp/curriculum";
import { isSogpWeekNumber } from "@/lib/sogp/week-certificates";

/**
 * Every certificate the learner has: one per completed week of the current
 * cohort, the final certificate, and any from earlier cohorts. Read-only;
 * week certificates are awarded when the SOGP dashboard loads or after a
 * learner completes something.
 */
export default async function SogpCertificatePage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/certificate");
  const [loaded, all] = await Promise.all([
    getActiveSogpJourneyWithContext(session.user.id),
    listSogpCertificatesForUser(session.user.id),
  ]);
  if (!loaded) redirect("/sogp/enrol");

  const { journey, context } = loaded;
  const shareUrl = await getSogpCertificateShareUrl(context.enrollmentId);
  const currentFinal = journey.certificates.final?.verificationCode;

  return (
    <SogpCertificatesPage
      data={{
        cohortTitle: context.cohortTitle,
        todayKey: journey.todayKey,
        policy: journey.certificates.policy,
        weeks: journey.certificates.weeks,
        final: journey.certificates.final,
        earlier: {
          weeks: all.weeks
            .filter((item) => item.cohortId !== context.cohortId)
            .flatMap((item) =>
              isSogpWeekNumber(item.week)
                ? [{
                    cohortTitle: item.cohortTitle,
                    week: item.week,
                    title: getSogpLevel(item.week).title,
                    verificationCode: item.verificationCode,
                    issuedAt: item.issuedAt.toISOString(),
                  }]
                : [],
            ),
          finals: all.finals
            .filter((item) => item.verificationCode !== currentFinal)
            .map((item) => ({
              cohortTitle: item.cohortTitle,
              verificationCode: item.verificationCode,
              issuedAt: item.issuedAt.toISOString(),
            })),
        },
        shareUrl,
      }}
    />
  );
}
