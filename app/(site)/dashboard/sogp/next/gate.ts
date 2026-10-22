import "server-only";

import { redirect } from "next/navigation";

import { getAppSession } from "@/lib/app-session";
import { getLearningHubData } from "@/lib/dashboard/learning-hub";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";

/** The pages after "What's next" open only for someone who may choose (SOGP finished or the cohort ended). */
export async function requireNextLearningChooser(returnTo: string) {
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  const userId: string = session.user.id;
  const view = await getOwnLearningView(userId);
  if (!view) redirect("/sogp/enrol");
  const hub = await getLearningHubData(userId, view.state).catch(() => null);
  if (!hub?.next.canChoose) redirect("/dashboard/sogp");
  return { userId, hub };
}
