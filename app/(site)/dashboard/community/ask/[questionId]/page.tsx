import { notFound, redirect } from "next/navigation";

import { QuestionThread } from "@/components/community/ask/question-thread";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { getQuestionForAsker } from "@/lib/db/queries/ask-pleros";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function AskPlerosQuestionRoute({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  const id = Number(questionId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  // Session and context load together instead of one roundtrip after the other.
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect(`/login?returnTo=/dashboard/community/ask/${id}`);
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  // Only the person who asked can open a conversation.
  const question = await getQuestionForAsker(ctx.userId, id);
  if (!question) notFound();

  return <QuestionThread key={question.id} initial={question} />;
}
