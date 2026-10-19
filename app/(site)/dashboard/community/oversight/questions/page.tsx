import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { GroupQuestionsWaiting } from "@/components/dashboard/church/group-oversight-view";
import { QuestionsWaiting } from "@/components/dashboard/church/oversight-view";
import { getAppSession } from "@/lib/app-session";
import { getGroupOversight } from "@/lib/db/queries/group-oversight";
import { getOversight } from "@/lib/db/queries/oversight";
import { groupOversightEnabled } from "@/lib/db/queries/oversight-tree";

// Reads the session on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Questions waiting" };

/** Leaders in the viewer's oversight with questions waiting: names and counts only. */
export default async function QuestionsWaitingPage({ searchParams }: { searchParams: Promise<{ under?: string }> }) {
  const [session, { under }] = await Promise.all([getAppSession(), searchParams]);
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/questions");
  if (groupOversightEnabled()) {
    const data = await getGroupOversight(session.user.id, { under });
    if (!data) redirect("/dashboard/community");
    return <GroupQuestionsWaiting data={data} />;
  }
  const data = await getOversight(session.user.id);
  if (!data) redirect("/dashboard/church");
  return <QuestionsWaiting data={data} />;
}
