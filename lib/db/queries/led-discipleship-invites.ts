import "server-only";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { buildDiscipleshipInviteUrl } from "@/lib/sogp/discipleship";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";
import { getSogpEnrollmentByUserId } from "./sogp";

export type LedGroupInvite = { id: number; name: string; inviteUrl: string };

/** The active discipleship groups this user leads, each with its invite link. Read-only. */
export async function listLedGroupInvites(userId: string): Promise<LedGroupInvite[]> {
  const leader = await getSogpEnrollmentByUserId(userId);
  if (!leader) return [];
  const rows = await db
    .select({ id: s.discipleshipGroups.id, name: s.discipleshipGroups.name, code: s.discipleshipGroups.inviteCode })
    .from(s.discipleshipGroups)
    .where(and(eq(s.discipleshipGroups.leaderEnrollmentId, leader.id), eq(s.discipleshipGroups.status, "active")))
    .orderBy(asc(s.discipleshipGroups.createdAt));
  const site = resolvePublicSiteUrl(process.env);
  return rows.map((row) => ({ id: row.id, name: row.name, inviteUrl: buildDiscipleshipInviteUrl(site, row.code) }));
}
