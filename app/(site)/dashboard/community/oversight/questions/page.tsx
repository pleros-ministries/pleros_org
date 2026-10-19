import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GroupQuestionsWaiting } from "@/components/dashboard/church/group-oversight-view";
import { getAppSession } from "@/lib/app-session";
import { getGroupOversight } from "@/lib/db/queries/group-oversight";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Questions waiting" };

/** Leaders in the viewer's oversight with questions waiting: names and counts only. */
export default async function QuestionsWaitingPage({ searchParams }: { searchParams: Promise<{ under?: string }> }) {
  const [session, { under }] = await Promise.all([getAppSession(), searchParams]);
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/questions");
  const data = await getGroupOversight(session.user.id, { under });
  if (!data) redirect("/dashboard/community");
  return <GroupQuestionsWaiting data={data} />;
}
