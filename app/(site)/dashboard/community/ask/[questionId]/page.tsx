import { notFound, redirect } from "next/navigation";

import { QuestionThread } from "@/components/community/ask/question-thread";
import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { getQuestionForAsker } from "@/lib/db/queries/ask-pleros";

export default async function AskPlerosQuestionRoute({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  const id = Number(questionId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const session = await getAppSession();
  if (!session) redirect(`/login?returnTo=/dashboard/community/ask/${id}`);

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  // Only the person who asked can open a conversation.
  const question = await getQuestionForAsker(ctx.userId, id);
  if (!question) notFound();

  return <QuestionThread key={question.id} initial={question} />;
}
