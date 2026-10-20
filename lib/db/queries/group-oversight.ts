import "server-only";

import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";

import { churchBranchIds } from "@/lib/church/permissions";
import { getCommunityContext } from "@/lib/community/context";
import { evaluateCanMessage, isMinor } from "@/lib/community/messaging";
import { db } from "@/lib/db";
import { fullestName } from "@/lib/db/name-search";
import * as s from "@/lib/db/schema";
import { lagosToday, shiftDate } from "@/lib/sogp/daily-date";

import { getChurchAssignment } from "./church-organisation";
import { loadReportStatusesForUsers, type ReportStatuses } from "./church-reports";
import { canOversee, listDescendants, listGroupPeople, type TreeEdge } from "./oversight-tree";

/**
 * Oversight on the group tree (Pastor, 19 October): a leader sees everyone
 * under them to any depth; the Pastor sees every group person; a branch pastor
 * sees group people placed in their branches plus their own tree. Questions
 * stay names and counts only.
 */

export const QUESTION_WAIT_DAYS = 3;
const DAY_MS = 86_400_000;
/** Bounds one page's reads; a church this size pages by branch or `under`. */
const PEOPLE_LIMIT = 2000;

export type GroupOversightPerson = {
  userId: string;
  name: string;
  overseerId: string | null;
  overseerName: string | null;
  groupId: number | null;
  groupName: string | null;
  /** Steps below the focus person; null in the Pastor's and branch pastor's wider view. */
  depth: number | null;
  branchId: number | null;
  /** Members in the groups this person leads; above 0 means their row opens their tree. */
  leadsMembers: number;
  atRisk: boolean;
  statuses: ReportStatuses;
  reportedToday: boolean;
  silentDays: number;
  /** Present only when the viewer may message them. */
  messageUserId: string | null;
};

export type GroupOversightGroup = { id: number; name: string; members: number; reportedToday: number };
export type GroupOversightBranch = { id: number; name: string; pastors: string[]; people: number; reportedToday: number; learners: number };
export type GroupOversightWaiting = { userId: string; name: string; waiting: number; oldestDays: number; messageUserId: string | null };

export type GroupOversightData = {
  role: "pastor" | "branch_pastor" | "leader";
  scopeLabel: string;
  /** Set when the page is scoped to one person's tree (`?under=`). */
  under: { userId: string; name: string } | null;
  people: GroupOversightPerson[];
  /** The focus person's own groups. */
  groups: GroupOversightGroup[];
  /** The group the viewer is in and who leads it (their overseer); only on their own Oversight. */
  memberOf: { groupId: number; groupName: string; leaderName: string } | null;
  branches: GroupOversightBranch[];
  waiting: GroupOversightWaiting[];
  totals: { people: number; reportedToday: number; atRisk: number; waiting: number; silent: number };
};

const reported = (statuses: ReportStatuses | undefined) => Boolean(statuses && Object.values(statuses).some(status => status !== "missing"));

async function loadNames(ids: string[]) {
  if (!ids.length) return new Map<string, { name: string; birthYear: number | null }>();
  const [users, enrolments] = await Promise.all([
    db.select({ id: s.users.id, name: s.users.name }).from(s.users).where(inArray(s.users.id, ids)),
    db.select({ userId: s.sogpEnrollments.userId, name: s.sogpEnrollments.name, birthYear: s.sogpEnrollments.birthYear })
      .from(s.sogpEnrollments).where(inArray(s.sogpEnrollments.userId, ids)).orderBy(desc(s.sogpEnrollments.createdAt)),
  ]);
  const latest = new Map<string, { name: string; birthYear: number | null }>();
  for (const row of enrolments) if (!latest.has(row.userId)) latest.set(row.userId, { name: row.name, birthYear: row.birthYear });
  return new Map(users.map(user => [user.id, { name: fullestName(user.name, latest.get(user.id)?.name) || "Member", birthYear: latest.get(user.id)?.birthYear ?? null }]));
}

/** Each person's branch: their latest enrolment's placement, else their church membership. */
async function loadBranches(ids: string[]) {
  if (!ids.length) return new Map<string, number>();
  const [viaEnrolment, viaMembership] = await Promise.all([
    db.select({ userId: s.sogpEnrollments.userId, branchId: s.sogpEnrollmentBranches.branchId })
      .from(s.sogpEnrollmentBranches)
      .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.sogpEnrollmentBranches.enrollmentId))
      .where(inArray(s.sogpEnrollments.userId, ids)).orderBy(desc(s.sogpEnrollments.createdAt)),
    db.select({ userId: s.churchBranchMemberships.userId, branchId: s.churchBranchMemberships.branchId })
      .from(s.churchBranchMemberships).where(inArray(s.churchBranchMemberships.userId, ids)),
  ]);
  const map = new Map<string, number>();
  for (const row of [...viaEnrolment, ...viaMembership]) if (!map.has(row.userId)) map.set(row.userId, row.branchId);
  return map;
}

/**
 * The viewer's Oversight, or null when they oversee no one. `under` scopes it
 * to one person in the viewer's oversight and the people below them.
 */
export async function getGroupOversight(viewerId: string, options: { under?: string | null } = {}): Promise<GroupOversightData | null> {
  const church = await getChurchAssignment(viewerId);
  const role = church?.role === "pastor" ? "pastor" : church?.role === "branch_pastor" ? "branch_pastor" : "leader";
  const viewerBranches = role === "branch_pastor" ? churchBranchIds(church) : [];
  const under = options.under && options.under !== viewerId ? options.under : null;
  if (under && !(await canOversee(viewerId, under))) return null;
  const focus = under ?? viewerId;

  // Who is in view: the focus person's tree, widened for the Pastor and branch pastors.
  const descendants = await listDescendants(focus);
  let edges: TreeEdge[] = descendants;
  let extraIds: string[] = [];
  if (!under && role !== "leader") {
    const everyone = await listGroupPeople();
    const own = new Set(descendants.map(edge => edge.userId));
    const wider = everyone.edges.filter(edge => !own.has(edge.userId)).map(edge => ({ ...edge, depth: -1 }));
    edges = [...descendants, ...wider];
    extraIds = everyone.roots.filter(id => id !== viewerId && !own.has(id));
  }
  let ids = [...new Set([...edges.map(edge => edge.userId), ...extraIds])].filter(id => id !== viewerId);
  const branchOf = await loadBranches([...new Set([...ids, ...edges.map(edge => edge.overseerId)])]);
  if (role === "branch_pastor" && !under) {
    // A branch pastor's wider view is their branches; their own tree stays whole.
    const own = new Set(descendants.map(edge => edge.userId));
    ids = ids.filter(id => own.has(id) || viewerBranches.includes(branchOf.get(id) ?? -1));
  }
  ids = ids.slice(0, PEOPLE_LIMIT);
  if (!ids.length && role === "leader") {
    // A leader whose groups are still empty gets Oversight's empty state; someone who leads nothing gets none.
    const [led] = await db.select({ id: s.discipleshipGroups.id }).from(s.discipleshipGroups)
      .where(and(eq(s.discipleshipGroups.leaderUserId, focus), inArray(s.discipleshipGroups.status, ["active", "archived"]))).limit(1);
    if (!led) return null;
  }

  const edgeOf = new Map(edges.map(edge => [edge.userId, edge]));
  const today = lagosToday();
  const waitCutoff = new Date(Date.now() - QUESTION_WAIT_DAYS * DAY_MS);
  const overseerIds = [...new Set(ids.map(id => edgeOf.get(id)?.overseerId).filter((id): id is string => Boolean(id)))];
  const groupIds = [...new Set(ids.map(id => edgeOf.get(id)?.groupId).filter((id): id is number => id != null))];

  const [names, groupRows, leadRows, riskRows, days, focusGroups, waitingRows, branchRows, learnerRows, ctx] = await Promise.all([
    loadNames([...new Set([...ids, ...overseerIds, focus])]),
    groupIds.length ? db.select({ id: s.discipleshipGroups.id, name: s.discipleshipGroups.name }).from(s.discipleshipGroups).where(inArray(s.discipleshipGroups.id, groupIds)) : [],
    ids.length ? db.select({ leaderId: s.discipleshipGroups.leaderUserId, n: sql<number>`count(*)::int` })
      .from(s.discipleshipMemberships).innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipMemberships.groupId))
      .where(and(inArray(s.discipleshipGroups.leaderUserId, ids), eq(s.discipleshipMemberships.status, "active"), inArray(s.discipleshipGroups.status, ["active", "archived"])))
      .groupBy(s.discipleshipGroups.leaderUserId) : [],
    ids.length ? db.select({ userId: s.discipleshipMemberships.memberUserId })
      .from(s.discipleshipMemberships)
      .where(and(inArray(s.discipleshipMemberships.memberUserId, ids), eq(s.discipleshipMemberships.status, "active"), inArray(s.discipleshipMemberships.lastKnownStatus, ["at_risk", "unresponsive"]))) : [],
    Promise.all([0, -1, -2].map(offset => loadReportStatusesForUsers(ids, shiftDate(today, offset)))),
    db.select({ id: s.discipleshipGroups.id, name: s.discipleshipGroups.name, isDefault: s.discipleshipGroups.isDefault })
      .from(s.discipleshipGroups).where(and(eq(s.discipleshipGroups.leaderUserId, focus), inArray(s.discipleshipGroups.status, ["active", "archived"])))
      .orderBy(desc(s.discipleshipGroups.isDefault), s.discipleshipGroups.createdAt),
    // Questions to anyone in view who leads, waiting past the limit: counts only, never text.
    db.select({ leaderId: s.discipleshipGroups.leaderUserId, n: sql<number>`count(*)::int`, oldest: sql<Date>`min(${s.discipleshipEpisodeQuestions.createdAt})` })
      .from(s.discipleshipEpisodeQuestions).innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipEpisodeQuestions.groupId))
      .where(and(isNull(s.discipleshipEpisodeQuestions.repliedAt), lt(s.discipleshipEpisodeQuestions.createdAt, waitCutoff), inArray(s.discipleshipGroups.leaderUserId, [...new Set([...ids, focus])])))
      .groupBy(s.discipleshipGroups.leaderUserId),
    role !== "leader" && !under ? db.select({ id: s.churchBranches.id, name: s.churchBranches.name }).from(s.churchBranches)
      .where(role === "branch_pastor" ? inArray(s.churchBranches.id, viewerBranches.length ? viewerBranches : [-1]) : undefined).orderBy(s.churchBranches.name) : [],
    role !== "leader" && !under ? db.select({ branchId: s.sogpEnrollmentBranches.branchId, n: sql<number>`count(*)::int` }).from(s.sogpEnrollmentBranches).groupBy(s.sogpEnrollmentBranches.branchId) : [],
    getCommunityContext().catch(() => null),
  ]);
  const [memberOf] = under ? [] : await db
    .select({ groupId: s.discipleshipGroups.id, groupName: s.discipleshipGroups.name, leaderUserId: s.discipleshipGroups.leaderUserId })
    .from(s.discipleshipMemberships)
    .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipMemberships.groupId))
    .where(and(eq(s.discipleshipMemberships.memberUserId, viewerId), eq(s.discipleshipMemberships.status, "active"), inArray(s.discipleshipGroups.status, ["active", "archived"])))
    .limit(1);
  const overseerName = memberOf?.leaderUserId ? (await loadNames([memberOf.leaderUserId])).get(memberOf.leaderUserId)?.name ?? "Member" : null;

  const canMessage = (userId: string) => {
    if (!ctx || userId === viewerId) return null;
    return evaluateCanMessage(
      { userId: ctx.userId, inCommunity: true, isAdmin: ctx.isAdmin, isMinor: ctx.isMinor, messagingBlocked: ctx.messagingBlocked },
      { userId, inCommunity: true, isAdmin: false, isMinor: isMinor(names.get(userId)?.birthYear ?? null), messagingBlocked: false },
      { blockedEitherWay: false, senderGuidesRecipient: false, recipientGuidesSender: false },
    ).ok ? userId : null;
  };
  const groupName = new Map(groupRows.map(row => [row.id, row.name]));
  const leads = new Map(leadRows.flatMap(row => row.leaderId ? [[row.leaderId, row.n] as const] : []));
  const risky = new Set(riskRows.map(row => row.userId));
  const [todayStatuses, ...earlier] = days;

  const people: GroupOversightPerson[] = ids.map(userId => {
    const edge = edgeOf.get(userId);
    const history = [todayStatuses!.get(userId), ...earlier.map(day => day.get(userId))];
    const silent = history.findIndex(reported);
    return {
      userId,
      name: names.get(userId)?.name ?? "Member",
      overseerId: edge?.overseerId ?? null,
      overseerName: edge ? names.get(edge.overseerId)?.name ?? null : null,
      groupId: edge?.groupId ?? null,
      groupName: edge ? groupName.get(edge.groupId) ?? null : null,
      depth: edge && edge.depth > 0 ? edge.depth : null,
      branchId: branchOf.get(userId) ?? null,
      leadsMembers: leads.get(userId) ?? 0,
      atRisk: risky.has(userId),
      statuses: todayStatuses!.get(userId)!,
      reportedToday: reported(todayStatuses!.get(userId)),
      silentDays: silent === -1 ? history.length : silent,
      messageUserId: canMessage(userId),
    };
  }).sort((a, b) => (a.depth ?? 99) - (b.depth ?? 99) || a.name.localeCompare(b.name));

  const groups = focusGroups.map(group => {
    const members = people.filter(person => person.groupId === group.id && person.overseerId === focus);
    return { id: group.id, name: group.name, members: members.length, reportedToday: members.filter(person => person.reportedToday).length };
  });
  const waiting = waitingRows.flatMap(row => row.leaderId ? [{
    userId: row.leaderId,
    name: names.get(row.leaderId)?.name ?? "Member",
    waiting: row.n,
    oldestDays: Math.floor((Date.now() - new Date(row.oldest).getTime()) / DAY_MS),
    messageUserId: canMessage(row.leaderId),
  }] : []).sort((a, b) => b.waiting - a.waiting);

  const pastorRows = branchRows.length ? await db.select({ branchId: s.churchBranchPastors.branchId, name: s.users.name })
    .from(s.churchBranchPastors).innerJoin(s.users, eq(s.users.id, s.churchBranchPastors.userId))
    .where(inArray(s.churchBranchPastors.branchId, branchRows.map(row => row.id))) : [];
  const learners = new Map(learnerRows.map(row => [row.branchId, row.n]));
  const branches = branchRows.map(branch => {
    const inBranch = people.filter(person => person.branchId === branch.id);
    return { id: branch.id, name: branch.name, pastors: pastorRows.filter(row => row.branchId === branch.id).map(row => row.name), people: inBranch.length, reportedToday: inBranch.filter(person => person.reportedToday).length, learners: learners.get(branch.id) ?? 0 };
  });

  const scopeLabel = under ? `${names.get(under)?.name ?? "Member"}’s groups`
    // No church branding in Oversight (Pastor, 20 October: Pleros is not FCC's app).
    : role === "pastor" ? "Everyone in groups"
    : role === "branch_pastor" ? branches.map(branch => branch.name).join(", ") || "Your branch"
    : groups.length === 1 ? groups[0]!.name : `${groups.length} groups`;
  return {
    role,
    scopeLabel,
    under: under ? { userId: under, name: names.get(under)?.name ?? "Member" } : null,
    people,
    groups,
    memberOf: memberOf ? { groupId: memberOf.groupId, groupName: memberOf.groupName, leaderName: overseerName ?? "Member" } : null,
    branches,
    waiting,
    totals: {
      people: people.length,
      reportedToday: people.filter(person => person.reportedToday).length,
      atRisk: people.filter(person => person.atRisk).length,
      waiting: waiting.reduce((sum, row) => sum + row.waiting, 0),
      silent: people.filter(person => person.silentDays >= 3).length,
    },
  };
}
