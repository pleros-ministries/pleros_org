import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";
import { LearningBoundary } from "@/components/sogp/learning/learning-boundary";
import { isPlanPath } from "@/lib/sogp/learning-input";

// Reads the session on every request (Cache Components).
export const instant = false;
export default async function SogpPlanPage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/plan");
  const data = await getOwnLearningView(session.user.id);
  if (!data) redirect("/sogp/enrol");
  const { path } = await searchParams;
  const requestedPath = path === "podcast_one" || path === "podcast_two" || path === "doctrinal" ? path : undefined;
  // A plan path saved before its plan comes here to build it (user, 24 November).
  if (!data.state?.plan && !requestedPath && !isPlanPath(data.state?.path)) redirect("/dashboard/sogp/path");
  return <LearningBoundary mode="plan" initialData={data} requestedPath={requestedPath} />;
}
