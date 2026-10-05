"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";

import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import type { CommunityContext } from "@/lib/community/context";
import {
  ASK_PLEROS_LIMITS,
  ASK_PLEROS_MUTED_COPY,
  normaliseQuestionBody,
  parseAnonymityChoice,
  staffAskerLabel,
} from "@/lib/community/ask-pleros";
import {
  CommunityError,
  type CommunityActionResult,
} from "@/lib/community/errors";
import {
  addAskerMessage,
  countRecentAskerActivity,
  createQuestion,
  getQuestionForAsker,
  getQuestionForStaff,
  isAskerMuted,
  markQuestionReadByAsker,
  revealQuestionAsker,
} from "@/lib/db/queries/ask-pleros";
import { sendAskPlerosStaffNotification } from "@/lib/email/send";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";

async function requireCommunity(): Promise<CommunityContext> {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) throw new Error("Forbidden");
  return ctx;
}

/** Returns expected failures as data; thrown messages are hidden in production. */
async function run<T extends object>(
  fn: () => Promise<T>,
): Promise<CommunityActionResult<T>> {
  try {
    return { ok: true as const, ...(await fn()) };
  } catch (error) {
    if (error instanceof CommunityError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

function windowStart(minutes: number) {
  return new Date(Date.now() - minutes * 60_000);
}

async function assertWithinLimits(askerId: string, kind: "question" | "followUp") {
  const recent = await countRecentAskerActivity(askerId, {
    questions: windowStart(ASK_PLEROS_LIMITS.question.windowMinutes),
    messages: windowStart(ASK_PLEROS_LIMITS.followUp.windowMinutes),
  });
  if (kind === "question" && recent.questions >= ASK_PLEROS_LIMITS.question.max) {
    throw new CommunityError(
      "You have asked several questions today. You can ask again tomorrow.",
    );
  }
  if (recent.messages >= ASK_PLEROS_LIMITS.followUp.max) {
    throw new CommunityError(
      "You are sending messages very quickly. Take a short break and try again.",
    );
  }
}

/**
 * Emails the shared inbox. It reads the question back through the staff view,
 * so the email can only ever contain what staff are allowed to see.
 */
function emailStaff(questionId: number, message: string, isFollowUp: boolean) {
  after(() =>
    (async () => {
      const question = await getQuestionForStaff(questionId);
      if (!question) return;
      const result = await sendAskPlerosStaffNotification({
        askerLabel: staffAskerLabel(question.asker),
        groupName: question.asker.anonymous ? null : question.asker.groupName,
        message,
        isFollowUp,
        isAnonymous: question.asker.anonymous,
        adminUrl: `${resolvePublicSiteUrl(process.env)}/admin/questions?question=${questionId}`,
      });
      if (!result.ok && result.reason !== "missing_inbox") {
        console.error("Ask Pleros staff email not sent:", result.reason);
      }
    })().catch((error) =>
      console.error("Ask Pleros staff email failed:", error),
    ),
  );
}

/** Opens a private question to Pleros, anonymously or with the asker's name. */
export async function askPleros(input: {
  body: string;
  visibility: string;
}): Promise<CommunityActionResult<{ id: number }>> {
  return run(async () => {
    const ctx = await requireCommunity();
    if (await isAskerMuted(ctx.userId)) {
      throw new CommunityError(ASK_PLEROS_MUTED_COPY);
    }

    const isAnonymous = parseAnonymityChoice(input.visibility);
    if (isAnonymous === null) {
      throw new CommunityError(
        "Choose whether to ask anonymously or show your name.",
      );
    }
    const parsed = normaliseQuestionBody(input.body);
    if (!parsed.ok) throw new CommunityError(parsed.error);
    await assertWithinLimits(ctx.userId, "question");

    const question = await createQuestion({
      askerId: ctx.userId,
      isAnonymous,
      body: parsed.body,
    });
    emailStaff(question.id, parsed.body, false);

    revalidatePath("/dashboard/community/ask");
    revalidatePath("/admin/questions");
    return { id: question.id };
  });
}

/** The asker adds to their own conversation while it is not closed. */
export async function sendQuestionFollowUp(input: {
  questionId: number;
  body: string;
}): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const question = await getQuestionForAsker(ctx.userId, input.questionId);
    if (!question) {
      throw new CommunityError("This conversation is no longer available.");
    }
    if (question.status === "closed") {
      throw new CommunityError(
        "This conversation is closed. Ask a new question if you need more help.",
      );
    }
    if (await isAskerMuted(ctx.userId)) {
      throw new CommunityError(ASK_PLEROS_MUTED_COPY);
    }

    const parsed = normaliseQuestionBody(input.body);
    if (!parsed.ok) throw new CommunityError(parsed.error);
    await assertWithinLimits(ctx.userId, "followUp");

    await addAskerMessage({ questionId: question.id, body: parsed.body });
    emailStaff(question.id, parsed.body, true);

    revalidatePath(`/dashboard/community/ask/${question.id}`);
    revalidatePath("/admin/questions");
    return {};
  });
}

/** The asker chooses to show their name on one conversation. It cannot be undone. */
export async function revealQuestionIdentity(
  questionId: number,
): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const question = await getQuestionForAsker(ctx.userId, questionId);
    if (!question) {
      throw new CommunityError("This conversation is no longer available.");
    }
    await revealQuestionAsker(ctx.userId, questionId);
    revalidatePath(`/dashboard/community/ask/${questionId}`);
    revalidatePath("/admin/questions");
    return {};
  });
}

export async function markQuestionRead(questionId: number) {
  const ctx = await requireCommunity();
  if (!Number.isInteger(questionId)) return;
  await markQuestionReadByAsker(ctx.userId, questionId);
}
