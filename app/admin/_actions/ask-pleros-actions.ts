"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/require-role";
import {
  STAFF_REPLY_MAX,
  normaliseQuestionBody,
} from "@/lib/community/ask-pleros";
import { notifyPlerosReply } from "@/lib/community/notify";
import {
  addStaffReply,
  getQuestionDeliveryTarget,
  getQuestionForStaff,
  muteQuestionAsker,
  setQuestionStatus,
} from "@/lib/db/queries/ask-pleros";
import { sendPlerosReplyEmail } from "@/lib/email/send";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";

function revalidateQuestion(questionId: number) {
  revalidatePath("/admin/questions");
  revalidatePath("/dashboard/community/ask");
  revalidatePath(`/dashboard/community/ask/${questionId}`);
}

/**
 * An admin answers as "Pleros". The asker is told by bell, push and email;
 * the account behind the question is resolved here on the server and never
 * returned, so an anonymous asker stays unknown to the admin.
 */
export async function replyToPlerosQuestion(input: {
  questionId: number;
  body: string;
}) {
  const session = await requireAdmin();

  const parsed = normaliseQuestionBody(input.body, STAFF_REPLY_MAX);
  if (!parsed.ok) return { error: parsed.error };

  const question = await getQuestionForStaff(input.questionId);
  if (!question) return { error: "This question is no longer available." };

  await addStaffReply({
    questionId: question.id,
    staffUserId: session.user.id,
    body: parsed.body,
  });

  after(() =>
    (async () => {
      const target = await getQuestionDeliveryTarget(question.id);
      if (!target) return;
      const url = `${resolvePublicSiteUrl(process.env)}/dashboard/community/ask/${question.id}`;
      await Promise.allSettled([
        notifyPlerosReply({ userId: target.userId, questionId: question.id }),
        sendPlerosReplyEmail({ to: target.email, url }),
      ]);
    })().catch((error) =>
      console.error("Ask Pleros reply delivery failed:", error),
    ),
  );

  revalidateQuestion(question.id);
  return { error: null as string | null };
}

/** Close a conversation, or put it back in the open queue. */
export async function setPlerosQuestionStatus(input: {
  questionId: number;
  status: "open" | "closed";
}) {
  await requireAdmin();
  await setQuestionStatus(input.questionId, input.status);
  revalidateQuestion(input.questionId);
}

/**
 * Closes the conversation and stops further questions from whoever asked it.
 * The admin is not told who that is, and the mute is not listed anywhere.
 */
export async function mutePlerosAsker(questionId: number) {
  await requireAdmin();
  await muteQuestionAsker(questionId);
  await setQuestionStatus(questionId, "closed");
  revalidateQuestion(questionId);
}
