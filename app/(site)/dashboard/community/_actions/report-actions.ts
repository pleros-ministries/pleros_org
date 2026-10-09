"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
  type CommunityContext,
} from "@/lib/community/context";
import {
  CommunityError,
  type CommunityActionResult,
} from "@/lib/community/errors";
import {
  activityKindConfig,
  normaliseActivityInput,
} from "@/lib/community/ministry-activities";
import {
  canReportFor,
  isDateKey,
  type MinistryFieldKey,
} from "@/lib/community/ministry-report";
import {
  normaliseContactRows,
  normaliseFollowUpRows,
  type ContactRow,
  type ContactRowInput,
  type FollowUpRow,
  type FollowUpRowInput,
} from "@/lib/community/outreach-contacts";
import {
  deleteActivity,
  getActivityForEdit,
  getDisciplesMinistryDay,
  getOwnActivityDate,
  saveActivity,
  type ActivityFollowUp,
  type DiscipleMinistryDay,
} from "@/lib/db/queries/ministry-activities";
import type { ActivityPerson } from "@/lib/db/queries/outreach-contacts";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import { lagosToday } from "@/lib/sogp/daily-date";

const WINDOW_ERROR =
  "You can add or change an activity for today and the last two days only.";

async function requireCommunity(): Promise<CommunityContext> {
  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) throw new Error("Forbidden");
  return ctx;
}

function revalidateReports() {
  revalidatePath("/dashboard/community/report");
  revalidatePath("/dashboard/community/report/people");
  revalidatePath("/dashboard/community/report/history");
  revalidatePath("/dashboard/community/leader");
  revalidatePath("/admin/ministry");
}

/** Returns expected failures as data; thrown messages are hidden in production. */
async function run<T extends object>(
  fn: () => Promise<T>,
): Promise<CommunityActionResult<T>> {
  try {
    const value = await fn();
    return { ...value, ok: true as const };
  } catch (error) {
    if (error instanceof CommunityError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

export type SaveActivityInput = {
  /** Set when correcting an activity already saved. */
  activityId?: number | null;
  dateKey: string;
  kind: string;
  title?: string;
  mode?: string;
  platform?: string;
  platformOther?: string;
  location?: string;
  values: Partial<Record<MinistryFieldKey, string>>;
  note: string;
  /** Outreach: every person row in the form. */
  people?: ContactRowInput[];
  /** Follow-up: every existing person followed up. */
  followUps?: FollowUpRowInput[];
};

export type SaveActivityResult = {
  activityId: number;
  people: ActivityPerson[];
  followUps: ActivityFollowUp[];
};

/**
 * Adds or corrects one of the signed-in member's activities together with
 * the people in it. Days older than the reporting window are locked. Returns
 * the people as saved, so the form holds their ids for the next correction.
 */
export async function saveMinistryActivity(
  input: SaveActivityInput,
): Promise<CommunityActionResult<SaveActivityResult>> {
  return run(async () => {
    const ctx = await requireCommunity();
    if (!isDateKey(input.dateKey) || !canReportFor(input.dateKey, lagosToday())) {
      throw new CommunityError(WINDOW_ERROR);
    }

    let followUps: FollowUpRow[] = [];
    if (input.kind === "follow_up") {
      const rows = normaliseFollowUpRows(
        Array.isArray(input.followUps) ? input.followUps : [],
      );
      if (!rows.ok) throw new CommunityError(rows.error);
      followUps = rows.value;
    }

    const activityId =
      typeof input.activityId === "number" &&
      Number.isInteger(input.activityId) &&
      input.activityId > 0
        ? input.activityId
        : null;
    const parsed = normaliseActivityInput({
      kind: input.kind,
      title: input.title,
      mode: input.mode,
      platform: input.platform,
      platformOther: input.platformOther,
      location: input.location,
      note: input.note,
      values: input.values,
      peopleCount: followUps.length,
      // A kind no longer offered can still be corrected; the save keeps the kind unchanged.
      allowRetired: activityId !== null,
    });
    if (!parsed.ok) throw new CommunityError(parsed.error);

    let people: ContactRow[] = [];
    if (activityKindConfig(parsed.value.kind).people === "met") {
      const rows = normaliseContactRows(Array.isArray(input.people) ? input.people : []);
      if (!rows.ok) throw new CommunityError(rows.error);
      people = rows.value;
    }

    const saved = await saveActivity({
      userId: ctx.userId,
      activityId,
      dateKey: input.dateKey,
      activity: parsed.value,
      people,
      followUps,
    });

    revalidateReports();
    const stored = await getActivityForEdit(ctx.userId, saved.activityId);
    return {
      activityId: saved.activityId,
      people: stored?.people ?? [],
      followUps: stored?.followUpPeople ?? [],
    };
  });
}

/** Removes one of the signed-in member's activities; the people in it stay on their list. */
export async function deleteMinistryActivity(
  activityId: number,
): Promise<CommunityActionResult> {
  return run(async () => {
    const ctx = await requireCommunity();
    const activityDate = await getOwnActivityDate(ctx.userId, activityId);
    if (!activityDate) throw new CommunityError("That activity is no longer there.");
    if (!canReportFor(activityDate, lagosToday())) {
      throw new CommunityError(WINDOW_ERROR);
    }
    await deleteActivity(ctx.userId, activityId);
    revalidateReports();
    return {};
  });
}

/**
 * Read-only: the numbers the disciples in one of the signed-in discipler's own
 * groups logged on one day. Never includes a note, place or person.
 */
export async function getDiscipleMinistryAction(
  groupId: number,
  dateKey: string,
): Promise<DiscipleMinistryDay[]> {
  if (!isDateKey(dateKey)) throw new Error("Invalid date.");
  if (!Number.isInteger(groupId) || groupId <= 0) throw new Error("Invalid group.");
  const session = await getAppSession();
  if (!session) throw new Error("Unauthorised");
  const enrollment = await getSogpEnrollmentByUserId(session.user.id);
  if (!enrollment) return [];
  return getDisciplesMinistryDay(enrollment.id, groupId, dateKey);
}
