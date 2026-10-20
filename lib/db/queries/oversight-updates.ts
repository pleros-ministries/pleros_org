import "server-only";

import { and, eq, gt, inArray, sql } from "drizzle-orm";

import { CommunityError } from "@/lib/community/errors";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";

import type { GroupOversightData } from "./group-oversight";

/**
 * Oversight's Updates (Pastor, 20 October): the old "Needs you" as a list an
 * overseer works through, oldest first, and ticks off. Updates are computed
 * live from the people in view; `oversight_update_dones` (migration 0072)
 * only remembers what this viewer marked Done. Names and counts only, never
 * question, answer, check-in or prayer text.
 */

export type OversightUpdate = {
  key: string;
  kind: "silent" | "question" | "risk" | "joined";
  title: string;
  detail: string;
  href: string;
  /** When it started, for ordering and the time line; null when only the day is known. */
  at: string | null;
  done: boolean;
  /** How many people it covers, so the biggest undated ones come first. */
  weight?: number;
};

/** A quiet person or an at-risk one comes back as new a week after it was ticked off. */
const RECUR_MS = 7 * 86_400_000;
const JOINED_DAYS = 7;
const OVERSIGHT_PATH = "/dashboard/community/oversight";

const first = (name: string) => name.split(" ")[0] || name;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** A missing table (migration 0072 not yet applied) reads as nothing marked done. */
async function loadDones(viewerId: string) {
  try {
    return await db.select({ key: s.oversightUpdateDones.updateKey, doneAt: s.oversightUpdateDones.doneAt })
      .from(s.oversightUpdateDones).where(eq(s.oversightUpdateDones.userId, viewerId));
  } catch (error) {
    if (String((error as { cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code) === "42P01") return [];
    throw error;
  }
}

export async function getOversightUpdates(viewerId: string, data: GroupOversightData): Promise<OversightUpdate[]> {
  const ids = data.people.map(person => person.userId);
  const byId = new Map(data.people.map(person => [person.userId, person]));
  const since = new Date(Date.now() - JOINED_DAYS * 86_400_000);
  const [dones, joined] = await Promise.all([
    loadDones(viewerId),
    ids.length ? db.select({ id: s.discipleshipMemberships.id, userId: s.discipleshipMemberships.memberUserId, joinedAt: s.discipleshipMemberships.joinedAt })
      .from(s.discipleshipMemberships)
      .where(and(inArray(s.discipleshipMemberships.memberUserId, ids), eq(s.discipleshipMemberships.status, "active"), gt(s.discipleshipMemberships.joinedAt, since))) : [],
  ]);
  const doneAt = new Map(dones.map(row => [row.key, row.doneAt.getTime()]));
  const recurring = (key: string) => (doneAt.get(key) ?? 0) > Date.now() - RECUR_MS;
  const placeOf = (userId: string) => {
    const person = byId.get(userId);
    if (!person?.groupName) return "";
    return person.overseerId === (data.under?.userId ?? viewerId) ? person.groupName : `${person.overseerName ? `${first(person.overseerName)}’s ` : ""}${person.groupName}`;
  };
  const reportHref = (userId: string) => `/dashboard/church/${encodeURIComponent(userId)}`;

  const focus = data.under?.userId ?? viewerId;
  const updates: OversightUpdate[] = [];
  // The people you lead directly are named one by one; further down, each group
  // is one update for its leader's overseer, so a Pastor's list stays workable.
  const direct = data.people.filter(person => person.overseerId === focus);
  const further = new Map<number, { leaderId: string; leaderName: string; groupName: string; silent: number; risk: number; joined: number; lastJoin: number; lastJoinAt: string | null }>();
  const groupOf = (person: (typeof data.people)[number]) => {
    if (person.groupId == null || !person.overseerId) return null;
    const group = further.get(person.groupId) ?? { leaderId: person.overseerId, leaderName: person.overseerName ?? "Member", groupName: person.groupName ?? "group", silent: 0, risk: 0, joined: 0, lastJoin: 0, lastJoinAt: null };
    further.set(person.groupId, group);
    return group;
  };
  for (const person of direct) {
    if (person.silentDays < 3 && !person.atRisk) continue;
    const key = `quiet:${person.userId}`;
    const parts = [person.silentDays >= 3 ? `hasn’t reported in ${person.silentDays} days` : null, person.atRisk ? "is falling behind in SOGP" : null].filter(Boolean);
    updates.push({ key, kind: person.silentDays >= 3 ? "silent" : "risk", title: `${first(person.name)} ${parts.join(" and ")}`, detail: placeOf(person.userId), href: reportHref(person.userId), at: null, done: recurring(key) });
  }
  for (const person of data.people) {
    // Someone in no group (a top-level leader in the Pastor's view) has no overseer to report to.
    if (person.overseerId === focus || person.groupId == null) continue;
    if (person.silentDays >= 3) groupOf(person)!.silent += 1;
    if (person.atRisk) groupOf(person)!.risk += 1;
  }
  for (const row of data.waiting) {
    const key = `questions:${row.userId}`;
    const at = new Date(Date.now() - row.oldestDays * 86_400_000).toISOString();
    updates.push({ key, kind: "question", title: `${plural(row.waiting, "question")} waiting over 3 days`, detail: `${first(row.name)}’s group`, href: `${OVERSIGHT_PATH}/questions`, at, done: recurring(key) });
  }
  for (const row of joined) {
    const person = row.userId ? byId.get(row.userId) : undefined;
    if (!person) continue;
    if (person.overseerId === focus) {
      const key = `joined:${row.id}`;
      updates.push({ key, kind: "joined", title: `${first(person.name)} joined ${person.groupName ?? "your group"}`, detail: "", href: reportHref(person.userId), at: row.joinedAt.toISOString(), done: doneAt.has(key) });
      continue;
    }
    const group = groupOf(person);
    if (!group) continue;
    group.joined += 1;
    if (row.id > group.lastJoin) { group.lastJoin = row.id; group.lastJoinAt = row.joinedAt.toISOString(); }
  }
  for (const [groupId, group] of further) {
    const href = `${OVERSIGHT_PATH}/reports?under=${encodeURIComponent(group.leaderId)}`;
    const detail = `${first(group.leaderName)}’s ${group.groupName}`;
    if (group.silent || group.risk) {
      // One update per group for both, so a big church's list stays short.
      const key = `group-quiet:${groupId}`;
      const parts = [
        group.silent ? `${group.silent === 1 ? "1 person hasn’t" : `${group.silent} people haven’t`} reported in 3 days` : null,
        group.risk ? `${group.risk} behind in SOGP` : null,
      ].filter(Boolean);
      updates.push({ key, kind: group.silent ? "silent" : "risk", title: parts.join(" · "), detail, href, at: null, done: recurring(key), weight: group.silent + group.risk });
    }
    if (group.joined) {
      // The latest join names the update, so someone new joining brings it back.
      const key = `group-joined:${groupId}-${group.lastJoin}`;
      updates.push({ key, kind: "joined", title: group.joined === 1 ? `1 person joined ${first(group.leaderName)}’s group` : `${group.joined} people joined ${first(group.leaderName)}’s group`, detail: group.groupName, href: `${OVERSIGHT_PATH}?under=${encodeURIComponent(group.leaderId)}`, at: group.lastJoinAt, done: doneAt.has(key) });
    }
  }
  // Oldest first, so they can be worked through in order; undated ones (today's state) last.
  return updates.sort((a, b) => (a.at ?? "9") < (b.at ?? "9") ? -1 : (a.at ?? "9") > (b.at ?? "9") ? 1 : (b.weight ?? 1) - (a.weight ?? 1) || a.title.localeCompare(b.title));
}

export async function markOversightUpdateDone(viewerId: string, key: string, done: boolean) {
  if (!/^(quiet|questions|joined|group-quiet|group-joined):[\w-]{1,80}$/.test(key)) throw new CommunityError("That update can’t be ticked off.");
  try {
    if (done) {
      await db.insert(s.oversightUpdateDones).values({ userId: viewerId, updateKey: key })
        .onConflictDoUpdate({ target: [s.oversightUpdateDones.userId, s.oversightUpdateDones.updateKey], set: { doneAt: sql`now()` } });
    } else {
      await db.delete(s.oversightUpdateDones).where(and(eq(s.oversightUpdateDones.userId, viewerId), eq(s.oversightUpdateDones.updateKey, key)));
    }
  } catch (error) {
    if (String((error as { cause?: { code?: string } })?.cause?.code ?? (error as { code?: string })?.code) === "42P01") throw new CommunityError("Updates can’t be ticked off yet. Try again later.");
    throw error;
  }
}
