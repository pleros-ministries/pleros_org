import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";
import { LearningBoundary } from "@/components/sogp/learning/learning-boundary";
export default async function SogpPlanPage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/plan");
  const data = await getOwnLearningView(session.user.id);
  if (!data) redirect("/sogp/enrol");
  const { path } = await searchParams;
  const requestedPath = path === "podcast_one" || path === "podcast_two" ? path : undefined;
  if (!data.state?.plan && !requestedPath) redirect("/dashboard/sogp/path");
  return <LearningBoundary mode="plan" initialData={data} requestedPath={requestedPath} />;
}
