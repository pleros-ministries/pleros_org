import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { NextLessonView } from "@/components/sogp/next-learning/next-lesson-view";
import { getAppSession } from "@/lib/app-session";
import { getChosenNextLesson } from "@/lib/db/queries/next-learning";

// Reads the session and params on every request (Cache Components).
export const instant = false;

export const metadata: Metadata = { title: "Teaching" };

/** A teaching chosen after SOGP; only while it is the learner's next learning. */
export default async function NextLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/sogp/lesson/${encodeURIComponent(lessonId)}`);
  const id = Number(lessonId);
  const data = Number.isInteger(id) ? await getChosenNextLesson(session.user.id, id) : null;
  if (!data) redirect("/dashboard/sogp/next");
  return <NextLessonView data={data} />;
}
