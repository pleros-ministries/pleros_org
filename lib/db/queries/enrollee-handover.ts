import "server-only";
import { and, asc, eq, ne, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { CommunityError } from "@/lib/community/errors";
import { firstNameOf, fullNameOf } from "@/lib/community/visibility";
import { fuzzyNameScore } from "@/lib/community/fuzzy-name";
import { fullestName, nameSearch } from "@/lib/db/name-search";

/**
 * Follow-up handover (user decision, 18 October): the person who currently
 * follows up an enrollee can pass them to any other Pleros member. Only the
 * current owner can do it, so nobody can take an enrollee or see their phone
 * number by handing them to themselves. Admins still reassign from /admin.
 */

export type HandoverCandidate = { userId: string; name: string; region: string | null };

// Year of birth only: anyone who could still be 17 this year is left out.
const adultThisYear = sql`(${s.sogpEnrollments.birthYear} is null or ${s.sogpEnrollments.birthYear} <= extract(year from now())::int - 18)`;

/** Members who can take over follow-up: active SOGP enrollees and pastors, by full name. */
export async function searchHandoverCandidates(callerUserId: string, enrollmentId: number, rawTerm: unknown): Promise<HandoverCandidate[]> {
  const term = typeof rawTerm === "string" ? rawTerm.trim().slice(0, 60) : "";
  if (term.length < 2) return [];
  const [enrollee] = await db.select({ userId: s.sogpEnrollments.userId }).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.id, enrollmentId)).limit(1);
  const search = nameSearch(term, sql`concat_ws(' ', ${s.users.name}, ${s.sogpEnrollments.name})`);
  if (!search) return [];
  const rows = await db
    .select({ userId: s.users.id, name: s.users.name, enrolledName: s.sogpEnrollments.name, region: s.sogpEnrollments.region })
    .from(s.users)
    .leftJoin(s.sogpEnrollments, and(eq(s.sogpEnrollments.userId, s.users.id), ne(s.sogpEnrollments.status, "withdrawn")))
    .where(and(
      search.loose,
      ne(s.users.id, callerUserId),
      enrollee ? ne(s.users.id, enrollee.userId) : undefined,
      or(eq(s.users.role, "pastor"), eq(s.users.isPastor, true), and(sql`${s.sogpEnrollments.id} is not null`, adultThisYear)),
    ))
    .orderBy(search.rank, asc(s.users.name), asc(s.users.id))
    .limit(400);
  // Rank by the fuzzy matcher over both stored names (user report, 19 October:
  // an account name alone is sometimes only a first name).
  const best = new Map<string, HandoverCandidate & { score: number }>();
  for (const row of rows) {
    const name = fullestName(row.name, row.enrolledName);
    const score = Math.max(fuzzyNameScore(term, row.name ?? ""), fuzzyNameScore(term, row.enrolledName ?? ""));
    if (!name || !score) continue;
    const current = best.get(row.userId);
    if (!current || score > current.score) best.set(row.userId, { userId: row.userId, name: fullNameOf(name), region: row.region || current?.region || null, score });
  }
  return [...best.values()]
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .slice(0, 15)
    .map(({ userId, name, region }) => ({ userId, name, region }));
}

/** Moves the enrollee to `newOwnerUserId` if the caller still follows them up. Returns names for the notice. */
export async function handOverEnrollee(callerUserId: string, enrollmentId: number, newOwnerUserId: string) {
  if (!Number.isSafeInteger(enrollmentId) || enrollmentId <= 0 || typeof newOwnerUserId !== "string" || !newOwnerUserId) throw new CommunityError("Choose who should follow them up.");
  if (newOwnerUserId === callerUserId) throw new CommunityError("They already follow up with you.");
  const [enrollee] = await db.select({ userId: s.sogpEnrollments.userId, name: s.sogpEnrollments.name, firstName: s.sogpEnrollments.firstName }).from(s.sogpEnrollments).where(eq(s.sogpEnrollments.id, enrollmentId)).limit(1);
  if (!enrollee) throw new CommunityError("This enrollee could not be found.");
  if (enrollee.userId === newOwnerUserId) throw new CommunityError("Choose someone other than the enrollee.");
  const [target] = await db.select({ id: s.users.id, name: s.users.name, role: s.users.role, isPastor: s.users.isPastor }).from(s.users).where(eq(s.users.id, newOwnerUserId)).limit(1);
  if (!target) throw new CommunityError("That person could not be found.");
  if (target.role !== "pastor" && !target.isPastor) {
    const [active] = await db.select({ id: s.sogpEnrollments.id }).from(s.sogpEnrollments)
      .where(and(eq(s.sogpEnrollments.userId, newOwnerUserId), ne(s.sogpEnrollments.status, "withdrawn"), adultThisYear)).limit(1);
    if (!active) throw new CommunityError("Choose an active Pleros member.");
  }
  // The owner check and the move are one statement, so two people cannot both hand the same enrollee on.
  const moved = await db.update(s.pastorAssignments)
    .set({ pastorUserId: newOwnerUserId, assignedBy: callerUserId, assignedAt: new Date() })
    .where(and(eq(s.pastorAssignments.enrollmentId, enrollmentId), eq(s.pastorAssignments.pastorUserId, callerUserId)))
    .returning({ id: s.pastorAssignments.enrollmentId });
  if (!moved.length) throw new CommunityError("Only their current follow-up person can hand them over.");
  return { enrollmentId, enrolleeUserId: enrollee.userId, enrolleeFirstName: firstNameOf(enrollee.firstName || enrollee.name), newOwnerFirstName: firstNameOf(target.name) };
}

export const HANDOVER_BATCH_MAX = 50;

/** Several enrollees to one person (My enrollees multi-select). Each move is guarded on its own; any the caller no longer owns are skipped. */
export async function handOverEnrollees(callerUserId: string, rawIds: unknown, newOwnerUserId: string) {
  const ids = Array.isArray(rawIds) ? [...new Set(rawIds.filter((id): id is number => typeof id === "number" && Number.isSafeInteger(id) && id > 0))] : [];
  if (!ids.length) throw new CommunityError("Choose who to hand over.");
  if (ids.length > HANDOVER_BATCH_MAX) throw new CommunityError(`Hand over up to ${HANDOVER_BATCH_MAX} people at a time.`);
  const moved: Awaited<ReturnType<typeof handOverEnrollee>>[] = [];
  let skipped = 0;
  for (const id of ids) {
    try { moved.push(await handOverEnrollee(callerUserId, id, newOwnerUserId)); }
    catch (error) {
      // The first failure that is about the new owner applies to every row, so stop and say so.
      if (error instanceof CommunityError && !/current follow-up person|could not be found|other than the enrollee/.test(error.message)) throw error;
      skipped += 1;
    }
  }
  if (!moved.length) throw new CommunityError("None of these could be handed over. They may already have moved.");
  return { moved, skipped };
}
