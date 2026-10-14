import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app-session";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";
import { LearningBoundary } from "@/components/sogp/learning/learning-boundary";
export default async function SogpListeningPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/sogp/listen");
  const data = await getOwnLearningView(session.user.id);
  if (!data) redirect("/sogp/enrol");
  const day = Number((await searchParams).day);
  return <LearningBoundary mode="listen" initialData={data} requestedDay={Number.isSafeInteger(day) && day > 0 ? day : undefined} />;
}
