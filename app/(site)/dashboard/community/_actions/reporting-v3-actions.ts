"use server";

import { revalidatePath } from "next/cache";
import { getCommunityContext } from "@/lib/community/context";
import { canAccessReporting } from "@/lib/community/reporting-access";
import { CommunityError } from "@/lib/community/errors";
import { createPrivateMinistryContact, listReportContactChoices } from "@/lib/db/queries/private-ministry-contacts";
import { saveMinistryReportV3 } from "@/lib/db/queries/ministry-report-v3";
import { createSharedChurchMeeting, listSharedChurchMeetings, saveSharedMeetingAttendance } from "@/lib/db/queries/shared-church-meetings";

async function ownReportingIdentity() {
  const ctx = await getCommunityContext();
  if (!ctx || !await canAccessReporting(ctx)) throw new CommunityError("You do not have access to reporting.");
  return ctx.userId;
}
async function run<T>(fn: (userId: string) => Promise<T>) {
  try { return { ok: true as const, value: await fn(await ownReportingIdentity()) }; }
  catch (error) { if (error instanceof CommunityError) return { ok: false as const, error: error.message }; throw error; }
}
function refreshReporting() {
  for (const path of ["/dashboard", "/dashboard/community/report", "/dashboard/community/report/people", "/dashboard/community/report/history", "/dashboard/church", "/admin/ministry"]) revalidatePath(path);
}
export async function createPrivateContactAction(input: unknown) {
  return run(async userId => { const contact = await createPrivateMinistryContact(userId, input); refreshReporting(); return contact; });
}
export async function listSavedReportContactsAction() { return run(userId => listReportContactChoices(userId)); }
export async function saveUnifiedMinistryAction(input: unknown) {
  return run(async userId => { const result = await saveMinistryReportV3(userId, input); refreshReporting(); return result; });
}
export async function createSharedMeetingAction(input: unknown) {
  return run(async userId => { const result = await createSharedChurchMeeting(userId, input); refreshReporting(); return result; });
}
export async function saveSharedAttendanceAction(input: unknown) {
  return run(async userId => { const result = await saveSharedMeetingAttendance(userId, input); refreshReporting(); return result; });
}
export async function listSharedMeetingsAction(unitId: number, dateKey: string) { return run(userId => listSharedChurchMeetings(userId, unitId, dateKey)); }
