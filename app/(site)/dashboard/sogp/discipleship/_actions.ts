"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { notifyDiscipleship } from "@/lib/community/notify";
import {
  RateLimitError,
  assertCanCreateDiscipleshipPrompt,
} from "@/lib/community/rate-limit";
import { firstNameOf } from "@/lib/community/visibility";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import {
  DiscipleshipError,
  createDiscipleshipPrompt,
  createPrayerRequest,
  deletePrayerRequest,
  logDiscipleContact,
  markPrayerRequestAnswered,
  markPrayerRequestPrayed,
  sendDiscipleNudge,
  closeDiscipleshipGroup,
  createDiscipleshipGroup,
  joinDiscipleshipGroup,
  leaveDiscipleshipGroup,
  regenerateDiscipleshipInviteCode,
  removeDisciple,
  renameDiscipleshipGroup,
  replyToDiscipleshipResponse,
  requireActiveLedGroup,
  setDiscipleSharesPhone,
  setLeaderSharesPhone,
  upsertDiscipleshipResponse,
  getDiscipleDailyParticipation,
  type DiscipleDayParticipation,
} from "@/lib/db/queries/sogp-discipleship";
import { DAILY_DATE_PATTERN } from "@/lib/sogp/daily-participation";
import {
  DISCIPLESHIP_CONTACT_NOTE_MAX_LENGTH,
  DISCIPLESHIP_INVITE_COOKIE,
  DISCIPLESHIP_NUDGE_NOTE_MAX_LENGTH,
  DISCIPLESHIP_PRAYER_MAX_LENGTH,
  isManualContactKind,
  DISCIPLESHIP_PROMPT_MAX_LENGTH,
  DISCIPLESHIP_REPLY_MAX_LENGTH,
  DISCIPLESHIP_RESPONSE_MAX_LENGTH,
  buildDiscipleshipInvitePath,
  discipleshipJoinBlockMessage,
  isValidInviteCode,
} from "@/lib/sogp/discipleship";

const PAGE_PATH = "/dashboard/sogp/discipleship";

/** The community layout and discipleship space list a learner's groups by name. */
function revalidateCommunityDiscipleship() {
  revalidatePath("/dashboard/community", "layout");
}

export type DiscipleshipActionResult = { ok: true } | { ok: false; error: string };

/** Read-only: the activity of one of the signed-in leader's groups on one day. */
export async function getDiscipleParticipationAction(
  groupId: number,
  dateKey: string,
): Promise<DiscipleDayParticipation[]> {
  if (!DAILY_DATE_PATTERN.test(dateKey)) throw new Error("Invalid date.");
  const learner = await requireEnrolledLearner();
  return getDiscipleDailyParticipation(learner.enrollment.id, groupIdOf(groupId), dateKey);
}

async function requireEnrolledLearner() {
  const session = await getAppSession();
  if (!session) throw new DiscipleshipError("Log in to continue.");
  const enrollment = await getSogpEnrollmentByUserId(session.user.id);
  if (!enrollment) throw new DiscipleshipError("Enrol in SOGP to use discipleship groups.");
  return {
    userId: session.user.id,
    enrollment,
    firstName: firstNameOf(enrollment.firstName || enrollment.name),
  };
}

/** Runs an action, turning expected failures into inline messages. */
async function run(action: () => Promise<void>): Promise<DiscipleshipActionResult> {
  try {
    await action();
    revalidatePath(PAGE_PATH);
    return { ok: true };
  } catch (error) {
    if (error instanceof DiscipleshipError || error instanceof RateLimitError) {
      return { ok: false, error: error.message };
    }
    console.error("Discipleship action failed:", error);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/** A group id from the client. Whether it is the caller's own group is checked in the query. */
function groupIdOf(value: unknown) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new DiscipleshipError("This discipleship group isn't available.");
  }
  return id;
}

// ─── Leading groups ─────────────────────────────────────────────────────────

export async function createDiscipleshipGroupAction(input: {
  name: string;
}): Promise<DiscipleshipActionResult & { groupId?: number }> {
  let groupId: number | undefined;
  const result = await run(async () => {
    const learner = await requireEnrolledLearner();
    const group = await createDiscipleshipGroup({
      leaderEnrollmentId: learner.enrollment.id,
      name: input.name,
    });
    groupId = group.id;
    revalidateCommunityDiscipleship();
  });
  return result.ok ? { ok: true, groupId } : result;
}

export async function renameDiscipleshipGroupAction(input: {
  groupId: number;
  name: string;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    await renameDiscipleshipGroup({
      leaderEnrollmentId: learner.enrollment.id,
      groupId: groupIdOf(input.groupId),
      name: input.name,
    });
    revalidateCommunityDiscipleship();
  });
}

/** Closes a group for good: its link dies and its disciples are released. */
export async function closeDiscipleshipGroupAction(input: {
  groupId: number;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    await closeDiscipleshipGroup({
      leaderEnrollmentId: learner.enrollment.id,
      groupId: groupIdOf(input.groupId),
    });
    revalidateCommunityDiscipleship();
  });
}

export async function joinDiscipleshipGroupAction(input: {
  code: string;
  sharesPhone: boolean;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    if (!isValidInviteCode(input.code)) {
      throw new DiscipleshipError("This invite link isn't valid.");
    }
    const learner = await requireEnrolledLearner();
    const result = await joinDiscipleshipGroup({
      code: input.code,
      viewerEnrollmentId: learner.enrollment.id,
      sharesPhone: Boolean(input.sharesPhone),
    });
    if (!result.ok) throw new DiscipleshipError(discipleshipJoinBlockMessage(result.reason));

    (await cookies()).delete(DISCIPLESHIP_INVITE_COOKIE);
    revalidatePath(buildDiscipleshipInvitePath(input.code));
    revalidatePath("/dashboard/sogp");

    const leaderUserId = result.invite?.leaderUserId;
    // The leader may run several groups, so the push says which one. It is their own name for it.
    const groupName = result.invite?.groupName;
    if (leaderUserId) {
      after(() =>
        notifyDiscipleship({
          kind: "discipleship_joined",
          recipientUserIds: [leaderUserId],
          actorUserId: learner.userId,
          actorFirstName: learner.firstName,
          pushBody: groupName
            ? `${learner.firstName} joined ${groupName}.`
            : `${learner.firstName} joined your discipleship group.`,
        }).catch((error) => console.error("Discipleship join notify failed:", error)),
      );
    }
  });
}

export async function leaveDiscipleshipGroupAction(): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    await leaveDiscipleshipGroup(learner.enrollment.id);
  });
}

export async function removeDiscipleAction(input: {
  membershipId: number;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    await removeDisciple({
      leaderEnrollmentId: learner.enrollment.id,
      membershipId: Number(input.membershipId),
    });
  });
}

export async function setDiscipleSharesPhoneAction(input: {
  sharesPhone: boolean;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    await setDiscipleSharesPhone({
      discipleEnrollmentId: learner.enrollment.id,
      sharesPhone: Boolean(input.sharesPhone),
    });
  });
}

export async function setLeaderSharesPhoneAction(input: {
  groupId: number;
  sharesPhone: boolean;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    await setLeaderSharesPhone({
      leaderEnrollmentId: learner.enrollment.id,
      groupId: groupIdOf(input.groupId),
      sharesPhone: Boolean(input.sharesPhone),
    });
  });
}

export async function regenerateInviteLinkAction(input: {
  groupId: number;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    await regenerateDiscipleshipInviteCode(learner.enrollment.id, groupIdOf(input.groupId));
  });
}

export async function createDiscipleshipPromptAction(input: {
  groupId: number;
  body: string;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const body = clean(input.body, DISCIPLESHIP_PROMPT_MAX_LENGTH);
    if (!body) throw new DiscipleshipError("Write a question for your group first.");
    const learner = await requireEnrolledLearner();
    // Ownership first, so the per-group limit is only ever read for the caller's own group.
    const group = await requireActiveLedGroup(learner.enrollment.id, groupIdOf(input.groupId));
    await assertCanCreateDiscipleshipPrompt(group.id);

    const { recipientUserIds } = await createDiscipleshipPrompt({
      leaderEnrollmentId: learner.enrollment.id,
      groupId: group.id,
      body,
    });
    after(() =>
      notifyDiscipleship({
        kind: "discipleship_prompt",
        recipientUserIds,
        actorUserId: learner.userId,
        actorFirstName: learner.firstName,
        pushBody: `${learner.firstName} sent your group a check-in question.`,
      }).catch((error) => console.error("Discipleship prompt notify failed:", error)),
    );
  });
}

export async function answerDiscipleshipPromptAction(input: {
  promptId: number;
  body: string;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const body = clean(input.body, DISCIPLESHIP_RESPONSE_MAX_LENGTH);
    if (!body) throw new DiscipleshipError("Write your answer first.");
    const learner = await requireEnrolledLearner();
    const { leaderUserId, isFirstAnswer } = await upsertDiscipleshipResponse({
      discipleEnrollmentId: learner.enrollment.id,
      promptId: Number(input.promptId),
      body,
    });
    // Notify on the first answer only; edits stay quiet.
    if (isFirstAnswer) {
      after(() =>
        notifyDiscipleship({
          kind: "discipleship_response",
          recipientUserIds: [leaderUserId],
          actorUserId: learner.userId,
          actorFirstName: learner.firstName,
          pushBody: `${learner.firstName} answered your check-in.`,
        }).catch((error) => console.error("Discipleship answer notify failed:", error)),
      );
    }
  });
}

export async function replyToDiscipleshipAnswerAction(input: {
  responseId: number;
  reply: string;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const reply = clean(input.reply, DISCIPLESHIP_REPLY_MAX_LENGTH);
    if (!reply) throw new DiscipleshipError("Write your reply first.");
    const learner = await requireEnrolledLearner();
    const { discipleUserId } = await replyToDiscipleshipResponse({
      leaderEnrollmentId: learner.enrollment.id,
      responseId: Number(input.responseId),
      reply,
    });
    after(() =>
      notifyDiscipleship({
        kind: "discipleship_reply",
        recipientUserIds: [discipleUserId],
        actorUserId: learner.userId,
        actorFirstName: learner.firstName,
        pushBody: `${learner.firstName} replied to your check-in answer.`,
      }).catch((error) => console.error("Discipleship reply notify failed:", error)),
    );
  });
}

// ─── Nudges and contact log ─────────────────────────────────────────────────

export async function sendNudgeAction(input: {
  membershipId: number;
  nudgeKey: string;
  personalNote?: string;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    const { discipleUserId, message } = await sendDiscipleNudge({
      leaderEnrollmentId: learner.enrollment.id,
      membershipId: Number(input.membershipId),
      nudgeKey: String(input.nudgeKey),
      personalNote: clean(input.personalNote, DISCIPLESHIP_NUDGE_NOTE_MAX_LENGTH),
    });
    after(() =>
      notifyDiscipleship({
        kind: "discipleship_nudge",
        recipientUserIds: [discipleUserId],
        actorUserId: learner.userId,
        actorFirstName: learner.firstName,
        pushBody: message,
        payload: { message },
      }).catch((error) => console.error("Discipleship nudge notify failed:", error)),
    );
  });
}

export async function logContactAction(input: {
  membershipId: number;
  kind: string;
  note?: string;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    if (!isManualContactKind(String(input.kind))) {
      throw new DiscipleshipError("Choose how you reached out.");
    }
    const learner = await requireEnrolledLearner();
    await logDiscipleContact({
      leaderEnrollmentId: learner.enrollment.id,
      membershipId: Number(input.membershipId),
      kind: input.kind as Parameters<typeof logDiscipleContact>[0]["kind"],
      note: clean(input.note, DISCIPLESHIP_CONTACT_NOTE_MAX_LENGTH) || null,
    });
  });
}

/** Recorded when the discipler taps a WhatsApp shortcut; never blocks the link. */
export async function logWhatsAppContactAction(input: {
  membershipId: number;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    await logDiscipleContact({
      leaderEnrollmentId: learner.enrollment.id,
      membershipId: Number(input.membershipId),
      kind: "whatsapp",
      note: null,
    });
  });
}

// ─── Prayer requests ────────────────────────────────────────────────────────

export async function createPrayerRequestAction(input: {
  body: string;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const body = clean(input.body, DISCIPLESHIP_PRAYER_MAX_LENGTH);
    if (!body) throw new DiscipleshipError("Write your prayer request first.");
    const learner = await requireEnrolledLearner();
    const { leaderUserId } = await createPrayerRequest({
      discipleEnrollmentId: learner.enrollment.id,
      body,
    });
    if (leaderUserId) {
      after(() =>
        notifyDiscipleship({
          kind: "discipleship_prayer_request",
          recipientUserIds: [leaderUserId],
          actorUserId: learner.userId,
          actorFirstName: learner.firstName,
          pushBody: `${learner.firstName} shared a prayer request with you.`,
        }).catch((error) => console.error("Prayer request notify failed:", error)),
      );
    }
  });
}

export async function markPrayedAction(input: {
  requestId: number;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    const { discipleUserId } = await markPrayerRequestPrayed({
      leaderEnrollmentId: learner.enrollment.id,
      requestId: Number(input.requestId),
    });
    if (discipleUserId) {
      after(() =>
        notifyDiscipleship({
          kind: "discipleship_prayed",
          recipientUserIds: [discipleUserId],
          actorUserId: learner.userId,
          actorFirstName: learner.firstName,
          pushBody: `${learner.firstName} prayed for your request.`,
        }).catch((error) => console.error("Prayed notify failed:", error)),
      );
    }
  });
}

export async function markAnsweredAction(input: {
  requestId: number;
  answerNote?: string;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    const { leaderUserId } = await markPrayerRequestAnswered({
      discipleEnrollmentId: learner.enrollment.id,
      requestId: Number(input.requestId),
      answerNote: clean(input.answerNote, DISCIPLESHIP_PRAYER_MAX_LENGTH) || null,
    });
    if (leaderUserId) {
      after(() =>
        notifyDiscipleship({
          kind: "discipleship_prayer_answered",
          recipientUserIds: [leaderUserId],
          actorUserId: learner.userId,
          actorFirstName: learner.firstName,
          pushBody: `${learner.firstName} shared that a prayer was answered.`,
        }).catch((error) => console.error("Answered prayer notify failed:", error)),
      );
    }
  });
}

export async function deletePrayerRequestAction(input: {
  requestId: number;
}): Promise<DiscipleshipActionResult> {
  return run(async () => {
    const learner = await requireEnrolledLearner();
    await deletePrayerRequest({
      discipleEnrollmentId: learner.enrollment.id,
      requestId: Number(input.requestId),
    });
  });
}
