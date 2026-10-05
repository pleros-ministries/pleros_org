"use server";

import { revalidatePath } from "next/cache";

import { getAppSession } from "@/lib/app-session";
import { canAccessCommunity, getCommunityContext } from "@/lib/community/context";
import {
  CommunityError,
  type CommunityActionResult,
} from "@/lib/community/errors";
import {
  canReportFor,
  isDateKey,
  normaliseMinistryReport,
  type MinistryFieldKey,
} from "@/lib/community/ministry-report";
import {
  normaliseContactRows,
  type ContactRowInput,
} from "@/lib/community/outreach-contacts";
import {
  getDisciplesMinistryDay,
  type DiscipleMinistryDay,
} from "@/lib/db/queries/ministry-reports";
import {
  listContactsForDay,
  saveReportWithContacts,
  type OutreachContact,
} from "@/lib/db/queries/outreach-contacts";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";
import { lagosToday } from "@/lib/sogp/daily-date";

/**
 * Saves the signed-in member's ministry report for one day, together with the
 * people they met that day. Sending it again corrects that day; days older
 * than the reporting window are locked. Returns the people as saved, so the
 * form holds their ids for the next correction.
 */
export async function saveMinistryReport(input: {
  dateKey: string;
  values: Partial<Record<MinistryFieldKey, string>>;
  note: string;
  /** Every person row in the form for this day. */
  people: ContactRowInput[];
}): Promise<CommunityActionResult<{ people: OutreachContact[] }>> {
  try {
    const ctx = await getCommunityContext();
    if (!ctx || !canAccessCommunity(ctx)) throw new Error("Forbidden");

    if (!isDateKey(input.dateKey) || !canReportFor(input.dateKey, lagosToday())) {
      throw new CommunityError(
        "You can send or correct a report for today and the last two days only.",
      );
    }

    const parsed = normaliseMinistryReport({ ...input.values, note: input.note });
    if (!parsed.ok) throw new CommunityError(parsed.error);
    const people = normaliseContactRows(
      Array.isArray(input.people) ? input.people : [],
    );
    if (!people.ok) throw new CommunityError(people.error);

    await saveReportWithContacts({
      userId: ctx.userId,
      reportDate: input.dateKey,
      report: parsed.value,
      people: people.value,
    });

    revalidatePath("/dashboard/community/report");
    revalidatePath("/dashboard/community/report/people");
    revalidatePath("/dashboard/community/leader");
    revalidatePath("/dashboard");
    revalidatePath("/admin/ministry");
    return {
      ok: true,
      people: await listContactsForDay(ctx.userId, input.dateKey),
    };
  } catch (error) {
    // Thrown messages are hidden in production, so expected failures return as data.
    if (error instanceof CommunityError) {
      return { ok: false, error: error.message };
    }
    throw error;
  }
}

/**
 * Read-only: the numbers the signed-in discipler's own disciples reported on
 * one day. Never includes a disciple's note.
 */
export async function getDiscipleMinistryAction(
  dateKey: string,
): Promise<DiscipleMinistryDay[]> {
  if (!isDateKey(dateKey)) throw new Error("Invalid date.");
  const session = await getAppSession();
  if (!session) throw new Error("Unauthorised");
  const enrollment = await getSogpEnrollmentByUserId(session.user.id);
  if (!enrollment) return [];
  return getDisciplesMinistryDay(enrollment.id, dateKey);
}
