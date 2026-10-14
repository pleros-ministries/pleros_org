import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";
import { LearningBoundary } from "@/components/sogp/learning/learning-boundary";
export default async function LearningPathPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/path");
  const data = await getOwnLearningView(session.user.id);
  if (!data) redirect("/sogp/enrol");
  return <LearningBoundary mode="path" initialData={data} />;
}
