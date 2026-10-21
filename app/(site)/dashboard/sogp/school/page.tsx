import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SogpSchool } from "@/components/sogp/learning/sogp-school";
import { getAppSession } from "@/lib/app-session";
import { getLearningHubData } from "@/lib/dashboard/learning-hub";
import { getOwnCertificationFacts } from "@/lib/db/queries/sogp-certification-facts";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "School of God’s Purpose" };

/** The SOGP page that Learning's current learning opens (Pastor, 21 October). */
export default async function SogpSchoolPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/school");
  // One learning-state read, handed to both: a second would queue behind the learner lock.
  const view = await getOwnLearningView(session.user.id);
  if (!view) redirect("/sogp/enrol");
  const [hub, facts] = await Promise.all([
    getLearningHubData(session.user.id, view.state).catch(() => null),
    getOwnCertificationFacts(session.user.id, view.state).catch(() => null),
  ]);
  if (!hub) redirect("/dashboard/sogp");
  return <SogpSchool hub={hub} facts={facts} followUp={view.followUp} />;
}
