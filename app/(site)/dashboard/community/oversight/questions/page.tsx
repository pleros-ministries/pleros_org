import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { QuestionsWaiting } from "@/components/dashboard/church/oversight-view";
import { getAppSession } from "@/lib/app-session";
import { getOversight } from "@/lib/db/queries/oversight";

export const metadata: Metadata = { title: "Questions waiting" };

/** Disciplers in the viewer's oversight with questions waiting: names and counts only. */
export default async function QuestionsWaitingPage() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/oversight/questions");
  const data = await getOversight(session.user.id);
  if (!data) redirect("/dashboard/church");
  return <QuestionsWaiting data={data} />;
}
