import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LearningHistoryView } from "@/components/sogp/learning/learning-history";
import { getAppSession } from "@/lib/app-session";
import { getOwnLearningHistory } from "@/lib/db/queries/own-learning-history";

export const metadata: Metadata = { title: "Your history" };

/** The learner's own SOGP history: tracks, quiz scores, responses and group reviews. */
export default async function LearningHistoryPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/history");
  const history = await getOwnLearningHistory(session.user.id);
  if (!history) redirect("/sogp/enrol");
  return <LearningHistoryView history={history} />;
}
