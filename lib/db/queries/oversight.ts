import "server-only";

import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { churchBranchIds, canManageChurchAssignments } from "@/lib/church/permissions";
import { getCommunityContext } from "@/lib/community/context";
import { evaluateCanMessage, isMinor } from "@/lib/community/messaging";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { lagosToday, shiftDate } from "@/lib/sogp/daily-date";

import { getChurchHome, type ChurchBranchSummary } from "./church-home";
import { getChurchAssignment } from "./church-organisation";
import { getChurchRosterDay } from "./church-reports";

/** Questions count as waiting after this long without a reply. */
export const QUESTION_WAIT_DAYS = 3;
const DAY_MS = 86_400_000;

export type OversightDiscipler = {
  enrollmentId: number;
  name: string;
  branchId: number | null;
  branchName: string | null;
  groups: number;
  disciples: number;
  atRisk: number;
  /** Questions to this discipler unanswered for over QUESTION_WAIT_DAYS. Counts only, never text. */
  waiting: number;
  oldestWaitingDays: number | null;
  /** Present only when the viewer may message them (evaluateCanMessage). */
  messageUserId: string | null;
};

export type OversightWorker = { userId: string; name: string; role: string; branchId: number | null; unitId: number | null; reportedToday: boolean; silentDays: number };

export type OversightData = {
  role: "pastor" | "branch_pastor";
  scopeLabel: string;
  branches: Array<ChurchBranchSummary & { reportedToday: number; expected: number; learners: number }>;
  totals: { branches: number; units: number; workers: number; reportedToday: number; expected: number; atRisk: number; waiting: number };
  workers: OversightWorker[];
  disciplers: OversightDiscipler[];
};

const reported = (statuses: Record<string, string>) => Object.values(statuses).some(status => status !== "missing");

/**
 * The Pastor's whole church, or a Branch Pastor's branches: structure, today's
 * reports, disciplers and questions waiting. Null for anyone else. Question
 * text never leaves the discipler; this reads counts and dates only.
 */
export async function getOversight(viewerId: string): Promise<OversightData | null> {
  const viewer = await getChurchAssignment(viewerId);
  if (!canManageChurchAssignments(viewer)) return null;
  const home = await getChurchHome(viewerId);
  if (home.kind !== "structure") return null;
  const limited = viewer!.role === "branch_pastor";
  const branchIds = limited ? churchBranchIds(viewer) : home.branches.map(branch => branch.id);
  const today = lagosToday();

  const leader = alias(s.sogpEnrollments, "oversight_leader");
  const asker = alias(s.sogpEnrollmentBranches, "oversight_asker_branch");
  const waitCutoff = new Date(Date.now() - QUESTION_WAIT_DAYS * DAY_MS);

  const [days, learnerRows, leaderRows, waitingRows, ctx] = await Promise.all([
    Promise.all([0, -1, -2].map(offset => getChurchRosterDay(viewerId, shiftDate(today, offset)).catch(() => []))),
    branchIds.length ? db.select({ branchId: s.sogpEnrollmentBranches.branchId, n: sql<number>`count(*)::int` })
      .from(s.sogpEnrollmentBranches).where(inArray(s.sogpEnrollmentBranches.branchId, branchIds)).groupBy(s.sogpEnrollmentBranches.branchId) : [],
    // Disciplers placed in the viewer's branches, with their open groups.
    branchIds.length ? db.select({
      enrollmentId: leader.id, name: leader.name, userId: leader.userId, birthYear: leader.birthYear,
      branchId: s.sogpEnrollmentBranches.branchId,
      groups: sql<number>`count(distinct ${s.discipleshipGroups.id})::int`,
      disciples: sql<number>`count(${s.discipleshipMemberships.id})::int`,
      atRisk: sql<number>`count(${s.discipleshipMemberships.id}) filter (where ${s.discipleshipMemberships.lastKnownStatus} in ('at_risk', 'unresponsive'))::int`,
    })
      .from(s.discipleshipGroups)
      .innerJoin(leader, eq(leader.id, s.discipleshipGroups.leaderEnrollmentId))
      .innerJoin(s.sogpEnrollmentBranches, eq(s.sogpEnrollmentBranches.enrollmentId, leader.id))
      .innerJoin(s.discipleshipMemberships, and(eq(s.discipleshipMemberships.groupId, s.discipleshipGroups.id), eq(s.discipleshipMemberships.status, "active")))
      .where(and(eq(s.discipleshipGroups.status, "active"), inArray(s.sogpEnrollmentBranches.branchId, branchIds)))
      .groupBy(leader.id, leader.name, leader.userId, leader.birthYear, s.sogpEnrollmentBranches.branchId) : [],
    // Questions waiting, scoped by the asker's branch (their pastor and branch pastor).
    branchIds.length ? db.select({
      disciplerEnrollmentId: s.discipleshipEpisodeQuestions.disciplerEnrollmentId,
      n: sql<number>`count(*)::int`,
      oldest: sql<Date>`min(${s.discipleshipEpisodeQuestions.createdAt})`,
    })
      .from(s.discipleshipEpisodeQuestions)
      .innerJoin(asker, eq(asker.enrollmentId, s.discipleshipEpisodeQuestions.askerEnrollmentId))
      .where(and(isNull(s.discipleshipEpisodeQuestions.repliedAt), lt(s.discipleshipEpisodeQuestions.createdAt, waitCutoff), inArray(asker.branchId, branchIds)))
      .groupBy(s.discipleshipEpisodeQuestions.disciplerEnrollmentId) : [],
    getCommunityContext().catch(() => null),
  ]);

  // Disciplers with waiting questions but no group row (e.g. placed elsewhere) still show.
  const missing = waitingRows.map(row => row.disciplerEnrollmentId).filter((id): id is number => id != null && !leaderRows.some(item => item.enrollmentId === id));
  const extra = missing.length ? await db.select({ enrollmentId: s.sogpEnrollments.id, name: s.sogpEnrollments.name, userId: s.sogpEnrollments.userId, birthYear: s.sogpEnrollments.birthYear, branchId: s.sogpEnrollmentBranches.branchId })
    .from(s.sogpEnrollments).leftJoin(s.sogpEnrollmentBranches, eq(s.sogpEnrollmentBranches.enrollmentId, s.sogpEnrollments.id))
    .where(inArray(s.sogpEnrollments.id, missing)) : [];

  const branchName = new Map(home.branches.map(branch => [branch.id, branch.name]));
  const canMessage = (other: { userId: string; birthYear: number | null }) => ctx && other.userId !== viewerId && evaluateCanMessage(
    { userId: ctx.userId, inCommunity: true, isAdmin: ctx.isAdmin, isMinor: ctx.isMinor, messagingBlocked: ctx.messagingBlocked },
    { userId: other.userId, inCommunity: true, isAdmin: false, isMinor: isMinor(other.birthYear), messagingBlocked: false },
    { blockedEitherWay: false, senderGuidesRecipient: false, recipientGuidesSender: false },
  ).ok ? other.userId : null;
  const waitingBy = new Map(waitingRows.map(row => [row.disciplerEnrollmentId, row]));
  const disciplers: OversightDiscipler[] = [
    ...leaderRows.map(row => ({ ...row, base: true })),
    ...extra.map(row => ({ ...row, groups: 0, disciples: 0, atRisk: 0, base: false })),
  ].map(row => {
    const waiting = waitingBy.get(row.enrollmentId);
    return {
      enrollmentId: row.enrollmentId,
      name: row.name,
      branchId: row.branchId ?? null,
      branchName: row.branchId != null ? branchName.get(row.branchId) ?? null : null,
      groups: row.groups,
      disciples: row.disciples,
      atRisk: row.atRisk,
      waiting: waiting?.n ?? 0,
      oldestWaitingDays: waiting ? Math.floor((Date.now() - new Date(waiting.oldest).getTime()) / DAY_MS) : null,
      messageUserId: canMessage(row),
    };
  }).sort((a, b) => b.waiting - a.waiting || b.atRisk - a.atRisk || a.name.localeCompare(b.name));

  // People expected to report: workers and unit leaders on the roster.
  const [todayRows = [], ...earlier] = days;
  const expectedRows = todayRows.filter(row => row.role === "worker" || row.role === "unit_leader");
  const workers: OversightWorker[] = expectedRows.map(row => {
    const history = [row, ...earlier.map(day => day.find(item => item.userId === row.userId))];
    const silentDays = history.findIndex(day => day && reported(day.statuses as Record<string, string>));
    return {
      userId: row.userId, name: row.name, role: row.role, branchId: row.branchId, unitId: row.unitId,
      reportedToday: reported(row.statuses as Record<string, string>),
      silentDays: silentDays === -1 ? history.length : silentDays,
    };
  });

  const learners = new Map(learnerRows.map(row => [row.branchId, row.n]));
  const branches = home.branches.map(branch => {
    const inBranch = workers.filter(worker => worker.branchId === branch.id);
    return { ...branch, reportedToday: inBranch.filter(worker => worker.reportedToday).length, expected: inBranch.length, learners: learners.get(branch.id) ?? 0 };
  });
  return {
    role: viewer!.role as "pastor" | "branch_pastor",
    scopeLabel: limited ? branches.map(branch => branch.name).join(", ") || "Your branch" : "Fullness of Christ Church",
    branches,
    totals: {
      ...home.totals,
      reportedToday: workers.filter(worker => worker.reportedToday).length,
      expected: workers.length,
      atRisk: disciplers.reduce((sum, row) => sum + row.atRisk, 0),
      waiting: disciplers.reduce((sum, row) => sum + row.waiting, 0),
    },
    workers,
    disciplers,
  };
}
