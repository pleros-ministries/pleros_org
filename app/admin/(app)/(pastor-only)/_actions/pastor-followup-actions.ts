"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { requirePastorOrAdmin } from "@/lib/auth/require-role";
import { hasAdminAccess } from "@/lib/app-role";
import {
  pastorOwnsEnrollments,
  recordPastorContact,
  setSogpEnrollmentFullness,
} from "@/lib/db/queries/pastor-followups";
import {
  getCohortMoveTarget,
  moveEnrollmentsToCohort,
  setCohortMoveResponses,
  type CohortMoveResult,
} from "@/lib/db/queries/sogp-cohort-moves";
import { sendSogpEnrollmentEmails } from "@/lib/email/send";
import {
  COHORT_MOVE_BLOCKER_LABELS,
  isCohortMoveResponse,
  type CohortMoveResponse,
  type CohortMoveTarget,
} from "@/lib/sogp/cohort-move";
import { isFullnessMembership, type FullnessMembership } from "@/lib/sogp/fullness";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";

export async function recordFollowUpContact(input: {
  enrollmentId: number;
  channel: "whatsapp" | "call" | "email";
  /** Admin previewing a specific pastor's queue — ignored for pastor sessions. */
  pastorUserId?: string;
}) {
  const session = await requirePastorOrAdmin();

  const pastorUserId =
    session.user.role === "pastor" ? session.user.id : input.pastorUserId;

  if (!pastorUserId) {
    return { error: "A pastor must be specified." };
  }

  if (!hasAdminAccess(session.user.role) && pastorUserId !== session.user.id) {
    return { error: "Forbidden" };
  }

  await recordPastorContact(input.enrollmentId, pastorUserId);
  revalidatePath("/admin/my-enrollees");
  revalidatePath("/admin/pastors");
  return { error: null as string | null };
}

const MAX_FULLNESS_BATCH = 1000;

/** Distinct positive enrolment ids, or null when the selection is empty, too big or malformed. */
function parseEnrollmentIds(value: unknown, max: number): number[] | null {
  const ids = [...new Set((Array.isArray(value) ? value : []).map(Number))];
  if (!ids.length || ids.length > max || !ids.every((id) => Number.isInteger(id) && id > 0)) {
    return null;
  }
  return ids;
}

/** Admin: tag one or many enrollees as Fullness / Non-Fullness, or clear it. */
export async function setEnrolleeFullness(input: {
  enrollmentIds: number[];
  value: FullnessMembership | null;
}): Promise<{ error: string | null; updated: number }> {
  const session = await requirePastorOrAdmin();
  if (!hasAdminAccess(session.user.role)) return { error: "Forbidden", updated: 0 };

  const value = input.value === null ? null : isFullnessMembership(input.value) ? input.value : undefined;
  if (value === undefined) return { error: "Choose Fullness, Non-Fullness or Not set.", updated: 0 };

  const ids = parseEnrollmentIds(input.enrollmentIds, MAX_FULLNESS_BATCH);
  if (!ids) {
    return { error: `Select between 1 and ${MAX_FULLNESS_BATCH} enrollees.`, updated: 0 };
  }

  const updated = await setSogpEnrollmentFullness(ids, value);
  // Layout scope also refreshes each enrollee's detail page.
  revalidatePath("/admin/my-enrollees", "layout");
  return { error: null, updated };
}

// One Resend batch carries the confirmation emails for a whole move.
const MAX_COHORT_MOVE_BATCH = 100;

/**
 * Who is acting, and on which cohort. Admins may act on any enrolment, pastors
 * only on their own; the target must still be the cohort the page offered, so
 * a stale tab cannot move anyone into the wrong one.
 */
async function authoriseCohortMove(
  input: { enrollmentIds: number[]; targetCohortId: number },
): Promise<
  | { error: string }
  | { error: null; actorId: string; ids: number[]; target: CohortMoveTarget }
> {
  const session = await requirePastorOrAdmin();

  const ids = parseEnrollmentIds(input.enrollmentIds, MAX_COHORT_MOVE_BATCH);
  if (!ids) return { error: `Select between 1 and ${MAX_COHORT_MOVE_BATCH} enrollees.` };

  if (
    !hasAdminAccess(session.user.role) &&
    !(await pastorOwnsEnrollments(session.user.id, ids))
  ) {
    return { error: "Forbidden" };
  }

  const target = await getCohortMoveTarget();
  if (!target || target.id !== Number(input.targetCohortId)) {
    return { error: "That cohort is no longer open for moves. Refresh the page and try again." };
  }

  return { error: null, actorId: session.user.id, ids, target };
}

/** Record that enrollees were asked about the next cohort or declined it; null clears it. */
export async function setCohortMoveResponse(input: {
  enrollmentIds: number[];
  targetCohortId: number;
  response: CohortMoveResponse | null;
}): Promise<{ error: string | null; updated: number }> {
  const response =
    input.response === null ? null : isCohortMoveResponse(input.response) ? input.response : undefined;
  if (response === undefined) return { error: "Choose Asked, Declined or Not asked.", updated: 0 };

  const access = await authoriseCohortMove(input);
  if (access.error !== null) return { error: access.error, updated: 0 };

  const updated = await setCohortMoveResponses({
    enrollmentIds: access.ids,
    targetCohortId: access.target.id,
    response,
    actorId: access.actorId,
  });
  revalidatePath("/admin/my-enrollees", "layout");
  return { error: null, updated };
}

/**
 * Move enrollees who agreed into the next cohort and email each a
 * confirmation. Anyone who cannot move is returned in `skipped` with the
 * reason, without holding up the rest.
 */
export async function moveEnrolleesToCohort(input: {
  enrollmentIds: number[];
  targetCohortId: number;
}): Promise<{
  error: string | null;
  moved: number;
  skipped: Array<{ enrollmentId: number; name: string; reason: string }>;
}> {
  const access = await authoriseCohortMove(input);
  if (access.error !== null) return { error: access.error, moved: 0, skipped: [] };
  const { target } = access;

  let result: CohortMoveResult;
  try {
    result = await moveEnrollmentsToCohort({
      enrollmentIds: access.ids,
      targetCohortId: target.id,
      movedBy: access.actorId,
    });
  } catch (error) {
    console.error("SOGP cohort move failed:", error);
    return { error: "We could not complete the move. Try again shortly.", moved: 0, skipped: [] };
  }

  if (result.moved.length) {
    const recipients = result.moved;
    const dashboardUrl = `${resolvePublicSiteUrl(process.env)}/dashboard/sogp`;
    after(() =>
      sendSogpEnrollmentEmails(
        recipients.map((row) => ({
          to: row.email,
          name: row.name,
          cohortTitle: target.title,
          cohortDates: target.datesLabel,
          dashboardUrl,
        })),
      )
        .then((response) => {
          if (response?.error) console.error("SOGP cohort move email failed:", response.error);
        })
        .catch((error) => console.error("SOGP cohort move email failed:", error)),
    );

    revalidatePath("/admin/my-enrollees", "layout");
    revalidatePath("/admin/sogp");
    revalidatePath("/admin/pastors");
    revalidatePath("/dashboard/sogp", "layout");
  }

  return {
    error: null,
    moved: result.moved.length,
    skipped: result.skipped.map((row) => ({
      enrollmentId: row.enrollmentId,
      name: row.name,
      reason: COHORT_MOVE_BLOCKER_LABELS[row.reason],
    })),
  };
}
