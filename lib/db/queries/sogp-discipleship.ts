import { and, asc, count, desc, eq, gte, inArray, isNull, lte, max, ne, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import { notifyDiscipleship } from "@/lib/community/notify";
import { firstNameOf } from "@/lib/community/visibility";
import { PRE_SOGP_PREPARATION_DAYS } from "@/lib/sogp/calendar";
import { getPreparationTotalsByCohort } from "./sogp-preparation-length";
import { getSogpLevel, type SogpCurriculumLevel } from "@/lib/sogp/curriculum";
import {
  buildCurriculumPromptSuggestions,
  buildStatusAlertBody,
  buildWeeklyDigest,
  isDigestDay,
  shouldAlertStatusChange,
  buildDiscipleshipInviteUrl,
  buildWhatsAppUrl,
  defaultDiscipleshipGroupName,
  evaluateDiscipleshipJoin,
  findDiscipleshipNudge,
  generateInviteCode,
  type DiscipleshipJoinDecision,
  type DiscipleshipManualContactKind,
} from "@/lib/sogp/discipleship";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";
import type { StudentStatus } from "@/lib/sogp/student-status";
import { resolvePublicSiteUrl } from "@/lib/welcome-campaign";

import { getStudentStatusesForEnrollments } from "./sogp-daily";
import { getActiveSogpJourney } from "./sogp-journey";
import { ensureSogpReferralCode } from "./sogp-referrals";

const PROMPT_HISTORY_LIMIT = 20;
const DAY_MS = 24 * 60 * 60 * 1000;
const ANSWERED_PRAYER_WINDOW_DAYS = 30;

function nudgeCheckpointKey(membershipId: number, dateKey: string) {
  return `discipleship-nudge:${membershipId}:${dateKey}`;
}

export class DiscipleshipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiscipleshipError";
  }
}

// ─── Groups and invites ─────────────────────────────────────────────────────

/**
 * Returns the enrolment's discipleship group, creating it on first call. Both
 * unique indexes (leader, invite code) can collide under concurrency, so a
 * conflict re-reads by leader before retrying with a fresh code.
 */
export async function ensureDiscipleshipGroup(enrollment: {
  id: number;
  firstName: string;
  name: string;
}) {
  const existing = await getGroupByLeader(enrollment.id);
  if (existing) return existing;

  const name = defaultDiscipleshipGroupName(
    firstNameOf(enrollment.firstName || enrollment.name),
  );
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const [created] = await db
      .insert(schema.discipleshipGroups)
      .values({
        leaderEnrollmentId: enrollment.id,
        name,
        inviteCode: generateInviteCode(),
      })
      .onConflictDoNothing()
      .returning();
    if (created) return created;

    const concurrent = await getGroupByLeader(enrollment.id);
    if (concurrent) return concurrent;
  }
  throw new Error("Could not create a discipleship group.");
}

async function getGroupByLeader(leaderEnrollmentId: number) {
  const [group] = await db
    .select()
    .from(schema.discipleshipGroups)
    .where(eq(schema.discipleshipGroups.leaderEnrollmentId, leaderEnrollmentId))
    .limit(1);
  return group ?? null;
}

async function requireActiveGroup(leaderEnrollmentId: number) {
  const group = await getGroupByLeader(leaderEnrollmentId);
  if (!group || group.status !== "active") {
    throw new DiscipleshipError("Your discipleship group isn't available.");
  }
  return group;
}

export type DiscipleshipInvite = {
  groupId: number;
  groupName: string;
  status: "active" | "archived";
  leaderEnrollmentId: number;
  leaderUserId: string;
  leaderFirstName: string;
  leaderReferralCode: string;
  activeMemberCount: number;
};

export async function getDiscipleshipInvite(
  code: string,
): Promise<DiscipleshipInvite | null> {
  const [row] = await db
    .select({
      groupId: schema.discipleshipGroups.id,
      groupName: schema.discipleshipGroups.name,
      status: schema.discipleshipGroups.status,
      leaderEnrollmentId: schema.discipleshipGroups.leaderEnrollmentId,
      leaderUserId: schema.sogpEnrollments.userId,
      leaderFirstName: schema.sogpEnrollments.firstName,
      leaderName: schema.sogpEnrollments.name,
    })
    .from(schema.discipleshipGroups)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipGroups.leaderEnrollmentId),
    )
    .where(eq(schema.discipleshipGroups.inviteCode, code))
    .limit(1);
  if (!row) return null;

  const [{ n }, leaderReferralCode] = await Promise.all([
    countActiveMembers(row.groupId),
    ensureSogpReferralCode(row.leaderEnrollmentId),
  ]);

  return {
    groupId: row.groupId,
    groupName: row.groupName,
    status: row.status,
    leaderEnrollmentId: row.leaderEnrollmentId,
    leaderUserId: row.leaderUserId,
    leaderFirstName: firstNameOf(row.leaderFirstName || row.leaderName),
    leaderReferralCode,
    activeMemberCount: n,
  };
}

async function countActiveMembers(groupId: number) {
  const [row] = await db
    .select({ n: count() })
    .from(schema.discipleshipMemberships)
    .where(
      and(
        eq(schema.discipleshipMemberships.groupId, groupId),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    );
  return { n: row?.n ?? 0 };
}

async function getActiveMembership(discipleEnrollmentId: number) {
  const [membership] = await db
    .select()
    .from(schema.discipleshipMemberships)
    .where(
      and(
        eq(schema.discipleshipMemberships.discipleEnrollmentId, discipleEnrollmentId),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    )
    .limit(1);
  return membership ?? null;
}

/** True when `discipleEnrollmentId` is currently in the group led by `leaderEnrollmentId`. */
async function isActiveDiscipleOf(discipleEnrollmentId: number, leaderEnrollmentId: number) {
  const [row] = await db
    .select({ id: schema.discipleshipMemberships.id })
    .from(schema.discipleshipMemberships)
    .innerJoin(
      schema.discipleshipGroups,
      eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId),
    )
    .where(
      and(
        eq(schema.discipleshipMemberships.discipleEnrollmentId, discipleEnrollmentId),
        eq(schema.discipleshipMemberships.status, "active"),
        eq(schema.discipleshipGroups.leaderEnrollmentId, leaderEnrollmentId),
      ),
    )
    .limit(1);
  return Boolean(row);
}

export async function evaluateJoinForViewer(
  invite: DiscipleshipInvite,
  viewerEnrollmentId: number,
): Promise<DiscipleshipJoinDecision> {
  const [membership, leaderIsViewersDisciple] = await Promise.all([
    getActiveMembership(viewerEnrollmentId),
    isActiveDiscipleOf(invite.leaderEnrollmentId, viewerEnrollmentId),
  ]);
  return evaluateDiscipleshipJoin({
    viewerEnrollmentId,
    group: { leaderEnrollmentId: invite.leaderEnrollmentId, status: invite.status },
    viewerActiveGroupId: membership?.groupId ?? null,
    leaderIsViewersDisciple,
    activeMemberCount: invite.activeMemberCount,
  });
}

/**
 * Joins a group atomically: the group row is locked so the size cap holds under
 * concurrent joins, and the partial unique index guards one active discipler.
 */
export async function joinDiscipleshipGroup(input: {
  code: string;
  viewerEnrollmentId: number;
  sharesPhone: boolean;
}): Promise<DiscipleshipJoinDecision & { invite?: DiscipleshipInvite }> {
  const invite = await getDiscipleshipInvite(input.code);
  if (!invite) throw new DiscipleshipError("This invite link isn't valid.");

  try {
    return await transactionDb.transaction(async (tx) => {
      const [group] = await tx
        .select({
          id: schema.discipleshipGroups.id,
          status: schema.discipleshipGroups.status,
          leaderEnrollmentId: schema.discipleshipGroups.leaderEnrollmentId,
        })
        .from(schema.discipleshipGroups)
        .where(eq(schema.discipleshipGroups.id, invite.groupId))
        .for("update");
      if (!group) throw new DiscipleshipError("This invite link isn't valid.");

      const [[memberCount], [viewerMembership], [circular]] = await Promise.all([
        tx
          .select({ n: count() })
          .from(schema.discipleshipMemberships)
          .where(
            and(
              eq(schema.discipleshipMemberships.groupId, group.id),
              eq(schema.discipleshipMemberships.status, "active"),
            ),
          ),
        tx
          .select({ groupId: schema.discipleshipMemberships.groupId })
          .from(schema.discipleshipMemberships)
          .where(
            and(
              eq(schema.discipleshipMemberships.discipleEnrollmentId, input.viewerEnrollmentId),
              eq(schema.discipleshipMemberships.status, "active"),
            ),
          )
          .limit(1),
        tx
          .select({ id: schema.discipleshipMemberships.id })
          .from(schema.discipleshipMemberships)
          .innerJoin(
            schema.discipleshipGroups,
            eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId),
          )
          .where(
            and(
              eq(schema.discipleshipMemberships.discipleEnrollmentId, group.leaderEnrollmentId),
              eq(schema.discipleshipMemberships.status, "active"),
              eq(schema.discipleshipGroups.leaderEnrollmentId, input.viewerEnrollmentId),
            ),
          )
          .limit(1),
      ]);

      const decision = evaluateDiscipleshipJoin({
        viewerEnrollmentId: input.viewerEnrollmentId,
        group,
        viewerActiveGroupId: viewerMembership?.groupId ?? null,
        leaderIsViewersDisciple: Boolean(circular),
        activeMemberCount: memberCount?.n ?? 0,
      });
      if (!decision.ok) return decision;

      await tx.insert(schema.discipleshipMemberships).values({
        groupId: group.id,
        discipleEnrollmentId: input.viewerEnrollmentId,
        sharesPhone: input.sharesPhone,
      });
      return { ok: true as const, invite };
    });
  } catch (error) {
    // A concurrent join for the same learner lost the partial unique index race.
    if ((error as { code?: string }).code === "23505") {
      return { ok: false, reason: "already_in_group" };
    }
    throw error;
  }
}

// ─── Membership and settings mutations ──────────────────────────────────────

export async function leaveDiscipleshipGroup(discipleEnrollmentId: number) {
  await db
    .update(schema.discipleshipMemberships)
    .set({ status: "left", endedAt: new Date() })
    .where(
      and(
        eq(schema.discipleshipMemberships.discipleEnrollmentId, discipleEnrollmentId),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    );
}

export async function removeDisciple(input: {
  leaderEnrollmentId: number;
  membershipId: number;
}) {
  const group = await requireActiveGroup(input.leaderEnrollmentId);
  await db
    .update(schema.discipleshipMemberships)
    .set({ status: "removed", endedAt: new Date() })
    .where(
      and(
        eq(schema.discipleshipMemberships.id, input.membershipId),
        eq(schema.discipleshipMemberships.groupId, group.id),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    );
}

export async function setDiscipleSharesPhone(input: {
  discipleEnrollmentId: number;
  sharesPhone: boolean;
}) {
  await db
    .update(schema.discipleshipMemberships)
    .set({ sharesPhone: input.sharesPhone })
    .where(
      and(
        eq(schema.discipleshipMemberships.discipleEnrollmentId, input.discipleEnrollmentId),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    );
}

export async function setLeaderSharesPhone(input: {
  leaderEnrollmentId: number;
  sharesPhone: boolean;
}) {
  await db
    .update(schema.discipleshipGroups)
    .set({ leaderSharesPhone: input.sharesPhone, updatedAt: new Date() })
    .where(eq(schema.discipleshipGroups.leaderEnrollmentId, input.leaderEnrollmentId));
}

export async function regenerateDiscipleshipInviteCode(leaderEnrollmentId: number) {
  const group = await requireActiveGroup(leaderEnrollmentId);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const [updated] = await db
        .update(schema.discipleshipGroups)
        .set({ inviteCode: generateInviteCode(), updatedAt: new Date() })
        .where(eq(schema.discipleshipGroups.id, group.id))
        .returning({ inviteCode: schema.discipleshipGroups.inviteCode });
      if (updated) return updated.inviteCode;
    } catch (error) {
      if ((error as { code?: string }).code !== "23505" || attempt === 4) throw error;
    }
  }
  throw new Error("Could not create a new invite link.");
}

// ─── Check-in prompts ───────────────────────────────────────────────────────

/** Creates a prompt and returns the active disciples' user ids to notify. */
export async function createDiscipleshipPrompt(input: {
  leaderEnrollmentId: number;
  body: string;
}) {
  const group = await requireActiveGroup(input.leaderEnrollmentId);
  const [prompt] = await db
    .insert(schema.discipleshipPrompts)
    .values({ groupId: group.id, body: input.body })
    .returning({ id: schema.discipleshipPrompts.id });

  const recipients = await db
    .select({ userId: schema.sogpEnrollments.userId })
    .from(schema.discipleshipMemberships)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipMemberships.discipleEnrollmentId),
    )
    .where(
      and(
        eq(schema.discipleshipMemberships.groupId, group.id),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    );
  return { promptId: prompt!.id, groupId: group.id, recipientUserIds: recipients.map((r) => r.userId) };
}

/** Saves a disciple's answer (editable) and returns the leader's user id. */
export async function upsertDiscipleshipResponse(input: {
  discipleEnrollmentId: number;
  promptId: number;
  body: string;
}) {
  const membership = await getActiveMembership(input.discipleEnrollmentId);
  if (!membership) throw new DiscipleshipError("You're not in a discipleship group.");

  const [prompt] = await db
    .select({ id: schema.discipleshipPrompts.id, leaderUserId: schema.sogpEnrollments.userId })
    .from(schema.discipleshipPrompts)
    .innerJoin(
      schema.discipleshipGroups,
      eq(schema.discipleshipGroups.id, schema.discipleshipPrompts.groupId),
    )
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipGroups.leaderEnrollmentId),
    )
    .where(
      and(
        eq(schema.discipleshipPrompts.id, input.promptId),
        eq(schema.discipleshipPrompts.groupId, membership.groupId),
      ),
    )
    .limit(1);
  if (!prompt) throw new DiscipleshipError("This check-in isn't available.");

  const [existing] = await db
    .select({ id: schema.discipleshipPromptResponses.id })
    .from(schema.discipleshipPromptResponses)
    .where(
      and(
        eq(schema.discipleshipPromptResponses.promptId, input.promptId),
        eq(schema.discipleshipPromptResponses.discipleEnrollmentId, input.discipleEnrollmentId),
      ),
    )
    .limit(1);

  await db
    .insert(schema.discipleshipPromptResponses)
    .values({
      promptId: input.promptId,
      discipleEnrollmentId: input.discipleEnrollmentId,
      body: input.body,
    })
    .onConflictDoUpdate({
      target: [
        schema.discipleshipPromptResponses.promptId,
        schema.discipleshipPromptResponses.discipleEnrollmentId,
      ],
      set: { body: input.body, updatedAt: new Date() },
    });

  return { leaderUserId: prompt.leaderUserId, isFirstAnswer: !existing };
}

/** Saves the leader's reply to one answer and returns the disciple's user id. */
export async function replyToDiscipleshipResponse(input: {
  leaderEnrollmentId: number;
  responseId: number;
  reply: string;
}) {
  const group = await requireActiveGroup(input.leaderEnrollmentId);
  const [row] = await db
    .select({
      responseId: schema.discipleshipPromptResponses.id,
      discipleUserId: schema.sogpEnrollments.userId,
    })
    .from(schema.discipleshipPromptResponses)
    .innerJoin(
      schema.discipleshipPrompts,
      eq(schema.discipleshipPrompts.id, schema.discipleshipPromptResponses.promptId),
    )
    .innerJoin(
      schema.discipleshipMemberships,
      and(
        eq(
          schema.discipleshipMemberships.discipleEnrollmentId,
          schema.discipleshipPromptResponses.discipleEnrollmentId,
        ),
        eq(schema.discipleshipMemberships.groupId, group.id),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    )
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipPromptResponses.discipleEnrollmentId),
    )
    .where(
      and(
        eq(schema.discipleshipPromptResponses.id, input.responseId),
        eq(schema.discipleshipPrompts.groupId, group.id),
      ),
    )
    .limit(1);
  if (!row) throw new DiscipleshipError("This answer isn't available.");

  await db
    .update(schema.discipleshipPromptResponses)
    .set({ leaderReply: input.reply, leaderRepliedAt: new Date() })
    .where(eq(schema.discipleshipPromptResponses.id, row.responseId));

  return { discipleUserId: row.discipleUserId };
}

// ─── Dashboard read model ───────────────────────────────────────────────────

export type DiscipleSummary = {
  membershipId: number;
  enrollmentId: number;
  name: string;
  firstName: string;
  joinedAt: string;
  status: StudentStatus | null;
  preparationDaysComplete: number;
  preparationDaysTotal: number;
  coreCompleted: number | null;
  coreTotal: number | null;
  prayerCompleted: number | null;
  prayerTotal: number | null;
  prayerPercent: number | null;
  reviewsCompleted: number | null;
  reviewsTotal: number | null;
  averageQuizScore: number | null;
  eligible: boolean;
  lastActiveAt: string | null;
  whatsappUrl: string | null;
  lastContactedAt: string | null;
  contactCount: number;
  nudgedToday: boolean;
  openPrayerCount: number;
  recentContacts: Array<{ id: number; kind: ContactKind; note: string | null; createdAt: string }>;
};

type ContactKind = (typeof schema.discipleshipContactKindEnum.enumValues)[number];

export type DiscipleshipPrayerRequest = {
  id: number;
  discipleFirstName: string;
  body: string;
  status: "open" | "answered";
  answerNote: string | null;
  prayedAt: string | null;
  answeredAt: string | null;
  createdAt: string;
};

export type LeaderPrompt = {
  id: number;
  body: string;
  createdAt: string;
  responses: Array<{
    id: number;
    discipleEnrollmentId: number;
    discipleFirstName: string;
    body: string;
    updatedAt: string;
    leaderReply: string | null;
    leaderRepliedAt: string | null;
  }>;
};

export type DisciplerView = {
  groupName: string;
  leaderFirstName: string;
  leaderName: string;
  whatsappUrl: string | null;
  sharesPhone: boolean;
  joinedAt: string;
  prompts: Array<{
    id: number;
    body: string;
    createdAt: string;
    response: null | {
      body: string;
      updatedAt: string;
      leaderReply: string | null;
      leaderRepliedAt: string | null;
    };
  }>;
  prayerRequests: DiscipleshipPrayerRequest[];
};

export type DiscipleshipDashboardData = {
  viewer: { enrollmentId: number; firstName: string };
  myGroup: {
    id: number;
    name: string;
    inviteUrl: string;
    leaderSharesPhone: boolean;
    status: "active" | "archived";
    disciples: DiscipleSummary[];
    prompts: LeaderPrompt[];
    prayerRequests: DiscipleshipPrayerRequest[];
    promptSuggestions: { levelTitle: string | null; suggestions: string[] };
  };
  myDiscipler: DisciplerView | null;
};

export async function getDiscipleshipDashboard(
  userId: string,
): Promise<DiscipleshipDashboardData | null> {
  const [enrollment] = await db
    .select()
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.userId, userId))
    .orderBy(desc(schema.sogpEnrollments.createdAt))
    .limit(1);
  if (!enrollment) return null;

  const group = await ensureDiscipleshipGroup(enrollment);
  const [disciples, prompts, myDiscipler, prayerRequests, promptSuggestions] = await Promise.all([
    getDiscipleSummaries(group.id),
    getLeaderPrompts(group.id),
    getDisciplerView(enrollment.id),
    getGroupPrayerRequests(group.id),
    getPromptSuggestions(group.id, enrollment.cohortId),
  ]);

  return {
    viewer: {
      enrollmentId: enrollment.id,
      firstName: firstNameOf(enrollment.firstName || enrollment.name),
    },
    myGroup: {
      id: group.id,
      name: group.name,
      inviteUrl: buildDiscipleshipInviteUrl(resolvePublicSiteUrl(process.env), group.inviteCode),
      leaderSharesPhone: group.leaderSharesPhone,
      status: group.status,
      disciples,
      prompts,
      prayerRequests,
      promptSuggestions,
    },
    myDiscipler,
  };
}

async function getDiscipleSummaries(groupId: number): Promise<DiscipleSummary[]> {
  const members = await db
    .select({
      membershipId: schema.discipleshipMemberships.id,
      sharesPhone: schema.discipleshipMemberships.sharesPhone,
      joinedAt: schema.discipleshipMemberships.joinedAt,
      enrollmentId: schema.sogpEnrollments.id,
      userId: schema.sogpEnrollments.userId,
      cohortId: schema.sogpEnrollments.cohortId,
      enrollmentCreatedAt: schema.sogpEnrollments.createdAt,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
      phone: schema.sogpEnrollments.phone,
      countryCode: schema.sogpEnrollments.countryCode,
      lastContactedAt: schema.discipleshipMemberships.lastContactedAt,
      contactCount: schema.discipleshipMemberships.contactCount,
    })
    .from(schema.discipleshipMemberships)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipMemberships.discipleEnrollmentId),
    )
    .where(
      and(
        eq(schema.discipleshipMemberships.groupId, groupId),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    )
    .orderBy(asc(schema.discipleshipMemberships.joinedAt));
  if (members.length === 0) return [];

  const enrollmentIds = members.map((m) => m.enrollmentId);
  const userIds = members.map((m) => m.userId);
  const membershipIds = members.map((m) => m.membershipId);
  const todayKey = toLagosDateKey(new Date());

  const [contactRows, prayerCountRows, nudgeRows] = await Promise.all([
    db
      .select({
        id: schema.discipleshipContactLogs.id,
        membershipId: schema.discipleshipContactLogs.membershipId,
        kind: schema.discipleshipContactLogs.kind,
        note: schema.discipleshipContactLogs.note,
        createdAt: schema.discipleshipContactLogs.createdAt,
      })
      .from(schema.discipleshipContactLogs)
      .where(
        and(
          inArray(schema.discipleshipContactLogs.membershipId, membershipIds),
          // Totals live on the membership row; the list only needs recent entries.
          gte(schema.discipleshipContactLogs.createdAt, new Date(Date.now() - 90 * DAY_MS)),
        ),
      ),
    db
      .select({
        enrollmentId: schema.discipleshipPrayerRequests.discipleEnrollmentId,
        n: count(),
      })
      .from(schema.discipleshipPrayerRequests)
      .where(
        and(
          eq(schema.discipleshipPrayerRequests.groupId, groupId),
          eq(schema.discipleshipPrayerRequests.status, "open"),
        ),
      )
      .groupBy(schema.discipleshipPrayerRequests.discipleEnrollmentId),
    db
      .select({ key: schema.notificationCheckpoints.key })
      .from(schema.notificationCheckpoints)
      .where(inArray(schema.notificationCheckpoints.key, membershipIds.map((id) => nudgeCheckpointKey(id, todayKey)))),
  ]);
  const contactsByMembership = new Map<number, DiscipleSummary["recentContacts"]>();
  for (const row of [...contactRows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) {
    const list = contactsByMembership.get(row.membershipId) ?? [];
    if (list.length >= 5) continue;
    list.push({ id: row.id, kind: row.kind, note: row.note, createdAt: row.createdAt.toISOString() });
    contactsByMembership.set(row.membershipId, list);
  }
  const openPrayerByEnrollment = new Map(prayerCountRows.map((r) => [r.enrollmentId, r.n]));
  const nudgedKeys = new Set(nudgeRows.map((r) => r.key));

  const [statuses, journeys, prepRows, quizRows, activity] = await Promise.all([
    getStudentStatusesForEnrollments(
      members.map((m) => ({
        enrollmentId: m.enrollmentId,
        cohortId: m.cohortId,
        enrollmentCreatedAt: m.enrollmentCreatedAt,
      })),
    ),
    // Bounded by DISCIPLESHIP_GROUP_MAX; each call reuses the learner's own
    // dashboard read model so numbers match what the disciple sees.
    Promise.all(members.map((m) => getActiveSogpJourney(m.userId).catch(() => null))),
    db
      .select({
        enrollmentId: schema.sogpPreparationCompletions.enrollmentId,
        completed: count(),
        lastAt: max(schema.sogpPreparationCompletions.completedAt),
      })
      .from(schema.sogpPreparationCompletions)
      // Only published days count, so unpublished (rescheduled) days don't inflate progress.
      .innerJoin(
        schema.sogpPreparationDays,
        and(
          eq(schema.sogpPreparationDays.id, schema.sogpPreparationCompletions.preparationDayId),
          eq(schema.sogpPreparationDays.status, "published"),
        ),
      )
      .where(inArray(schema.sogpPreparationCompletions.enrollmentId, enrollmentIds))
      .groupBy(schema.sogpPreparationCompletions.enrollmentId),
    // Best score per lesson, limited to lessons in each disciple's own cohort.
    db
      .select({
        enrollmentId: schema.sogpEnrollments.id,
        lessonId: schema.quizAttempts.lessonId,
        best: sql<number>`max(${schema.quizAttempts.score})::int`,
      })
      .from(schema.quizAttempts)
      .innerJoin(
        schema.sogpEnrollments,
        eq(schema.sogpEnrollments.userId, schema.quizAttempts.userId),
      )
      .innerJoin(
        schema.sogpCohortTracks,
        and(
          eq(schema.sogpCohortTracks.cohortId, schema.sogpEnrollments.cohortId),
          eq(schema.sogpCohortTracks.lessonId, schema.quizAttempts.lessonId),
        ),
      )
      .where(inArray(schema.sogpEnrollments.id, enrollmentIds))
      .groupBy(schema.sogpEnrollments.id, schema.quizAttempts.lessonId),
    getLastActivityByUser(userIds),
  ]);

  const prepByEnrollment = new Map(prepRows.map((r) => [r.enrollmentId, r]));
  const prepTotalByCohort = await getPreparationTotalsByCohort(members.map((m) => m.cohortId));
  const scoresByEnrollment = new Map<number, number[]>();
  for (const row of quizRows) {
    const list = scoresByEnrollment.get(row.enrollmentId) ?? [];
    list.push(row.best);
    scoresByEnrollment.set(row.enrollmentId, list);
  }

  return members.map((member, index) => {
    // Journeys read the learner's latest enrolment — the progress that matters now.
    const progress = journeys[index]?.progress ?? null;
    const prep = prepByEnrollment.get(member.enrollmentId);
    const scores = scoresByEnrollment.get(member.enrollmentId) ?? [];
    const lastActive = latest([activity.get(member.userId) ?? null, prep?.lastAt ?? null]);
    const firstName = firstNameOf(member.firstName || member.name);

    return {
      membershipId: member.membershipId,
      enrollmentId: member.enrollmentId,
      name: member.name,
      firstName,
      joinedAt: member.joinedAt.toISOString(),
      status: statuses.get(member.enrollmentId) ?? null,
      preparationDaysComplete: prep?.completed ?? 0,
      preparationDaysTotal: prepTotalByCohort.get(member.cohortId) ?? PRE_SOGP_PREPARATION_DAYS,
      coreCompleted: progress?.coreCompleted ?? null,
      coreTotal: progress?.coreTotal ?? null,
      prayerCompleted: progress?.prayerCompleted ?? null,
      prayerTotal: progress?.prayerTotal ?? null,
      prayerPercent: progress?.prayerPercent ?? null,
      reviewsCompleted: progress?.reviewsCompleted ?? null,
      reviewsTotal: progress?.reviewsTotal ?? null,
      averageQuizScore: scores.length
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : null,
      eligible: progress?.eligible ?? false,
      lastActiveAt: lastActive?.toISOString() ?? null,
      whatsappUrl: member.sharesPhone
        ? buildWhatsAppUrl(member.phone, member.countryCode, `Hi ${firstName}, `)
        : null,
      lastContactedAt: member.lastContactedAt?.toISOString() ?? null,
      contactCount: member.contactCount,
      nudgedToday: nudgedKeys.has(nudgeCheckpointKey(member.membershipId, todayKey)),
      openPrayerCount: openPrayerByEnrollment.get(member.enrollmentId) ?? 0,
      recentContacts: contactsByMembership.get(member.membershipId) ?? [],
    };
  });
}

function latest(dates: Array<Date | string | null>): Date | null {
  let result: Date | null = null;
  for (const value of dates) {
    if (!value) continue;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) continue;
    if (!result || date > result) result = date;
  }
  return result;
}

async function getLastActivityByUser(userIds: string[]): Promise<Map<string, Date>> {
  const [quiz, prayer, reviews] = await Promise.all([
    db
      .select({ userId: schema.quizAttempts.userId, at: max(schema.quizAttempts.createdAt) })
      .from(schema.quizAttempts)
      .where(inArray(schema.quizAttempts.userId, userIds))
      .groupBy(schema.quizAttempts.userId),
    db
      .select({
        userId: schema.prayerWatchAttendance.userId,
        at: max(schema.prayerWatchAttendance.createdAt),
      })
      .from(schema.prayerWatchAttendance)
      .where(inArray(schema.prayerWatchAttendance.userId, userIds))
      .groupBy(schema.prayerWatchAttendance.userId),
    db
      .select({
        userId: schema.sogpLiveClassAttendance.userId,
        at: max(schema.sogpLiveClassAttendance.attendedAt),
      })
      .from(schema.sogpLiveClassAttendance)
      .where(inArray(schema.sogpLiveClassAttendance.userId, userIds))
      .groupBy(schema.sogpLiveClassAttendance.userId),
  ]);

  const result = new Map<string, Date>();
  for (const row of [...quiz, ...prayer, ...reviews]) {
    const date = latest([row.at]);
    if (!date) continue;
    const current = result.get(row.userId);
    if (!current || date > current) result.set(row.userId, date);
  }
  return result;
}

async function getLeaderPrompts(groupId: number): Promise<LeaderPrompt[]> {
  const prompts = await db
    .select()
    .from(schema.discipleshipPrompts)
    .where(eq(schema.discipleshipPrompts.groupId, groupId))
    .orderBy(desc(schema.discipleshipPrompts.createdAt))
    .limit(PROMPT_HISTORY_LIMIT);
  if (prompts.length === 0) return [];

  // Only answers from current disciples: leaving the group hides past answers.
  const responses = await db
    .select({
      id: schema.discipleshipPromptResponses.id,
      promptId: schema.discipleshipPromptResponses.promptId,
      discipleEnrollmentId: schema.discipleshipPromptResponses.discipleEnrollmentId,
      body: schema.discipleshipPromptResponses.body,
      updatedAt: schema.discipleshipPromptResponses.updatedAt,
      leaderReply: schema.discipleshipPromptResponses.leaderReply,
      leaderRepliedAt: schema.discipleshipPromptResponses.leaderRepliedAt,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
    })
    .from(schema.discipleshipPromptResponses)
    .innerJoin(
      schema.discipleshipMemberships,
      and(
        eq(
          schema.discipleshipMemberships.discipleEnrollmentId,
          schema.discipleshipPromptResponses.discipleEnrollmentId,
        ),
        eq(schema.discipleshipMemberships.groupId, groupId),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    )
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipPromptResponses.discipleEnrollmentId),
    )
    .where(
      inArray(
        schema.discipleshipPromptResponses.promptId,
        prompts.map((p) => p.id),
      ),
    )
    .orderBy(asc(schema.discipleshipPromptResponses.createdAt));

  return prompts.map((prompt) => ({
    id: prompt.id,
    body: prompt.body,
    createdAt: prompt.createdAt.toISOString(),
    responses: responses
      .filter((r) => r.promptId === prompt.id)
      .map((r) => ({
        id: r.id,
        discipleEnrollmentId: r.discipleEnrollmentId,
        discipleFirstName: firstNameOf(r.firstName || r.name),
        body: r.body,
        updatedAt: r.updatedAt.toISOString(),
        leaderReply: r.leaderReply,
        leaderRepliedAt: r.leaderRepliedAt?.toISOString() ?? null,
      })),
  }));
}

async function getDisciplerView(discipleEnrollmentId: number): Promise<DisciplerView | null> {
  const [row] = await db
    .select({
      groupId: schema.discipleshipGroups.id,
      groupName: schema.discipleshipGroups.name,
      groupStatus: schema.discipleshipGroups.status,
      leaderSharesPhone: schema.discipleshipGroups.leaderSharesPhone,
      sharesPhone: schema.discipleshipMemberships.sharesPhone,
      joinedAt: schema.discipleshipMemberships.joinedAt,
      leaderName: schema.sogpEnrollments.name,
      leaderFirstName: schema.sogpEnrollments.firstName,
      leaderPhone: schema.sogpEnrollments.phone,
      leaderCountryCode: schema.sogpEnrollments.countryCode,
    })
    .from(schema.discipleshipMemberships)
    .innerJoin(
      schema.discipleshipGroups,
      eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId),
    )
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipGroups.leaderEnrollmentId),
    )
    .where(
      and(
        eq(schema.discipleshipMemberships.discipleEnrollmentId, discipleEnrollmentId),
        eq(schema.discipleshipMemberships.status, "active"),
        ne(schema.discipleshipGroups.status, "archived"),
      ),
    )
    .limit(1);
  if (!row) return null;

  const prompts = await db
    .select({
      id: schema.discipleshipPrompts.id,
      body: schema.discipleshipPrompts.body,
      createdAt: schema.discipleshipPrompts.createdAt,
      responseBody: schema.discipleshipPromptResponses.body,
      responseUpdatedAt: schema.discipleshipPromptResponses.updatedAt,
      leaderReply: schema.discipleshipPromptResponses.leaderReply,
      leaderRepliedAt: schema.discipleshipPromptResponses.leaderRepliedAt,
    })
    .from(schema.discipleshipPrompts)
    .leftJoin(
      schema.discipleshipPromptResponses,
      and(
        eq(schema.discipleshipPromptResponses.promptId, schema.discipleshipPrompts.id),
        eq(schema.discipleshipPromptResponses.discipleEnrollmentId, discipleEnrollmentId),
      ),
    )
    .where(
      and(
        eq(schema.discipleshipPrompts.groupId, row.groupId),
        // Only check-ins sent since this learner joined.
        gte(schema.discipleshipPrompts.createdAt, row.joinedAt),
      ),
    )
    .orderBy(desc(schema.discipleshipPrompts.createdAt))
    .limit(PROMPT_HISTORY_LIMIT);

  const prayerRequests = await listPrayerRequests({
    groupId: row.groupId,
    discipleEnrollmentId,
  });

  const leaderFirstName = firstNameOf(row.leaderFirstName || row.leaderName);
  return {
    groupName: row.groupName,
    leaderFirstName,
    leaderName: row.leaderName,
    whatsappUrl: row.leaderSharesPhone
      ? buildWhatsAppUrl(row.leaderPhone, row.leaderCountryCode, `Hi ${leaderFirstName}, `)
      : null,
    sharesPhone: row.sharesPhone,
    joinedAt: row.joinedAt.toISOString(),
    prompts: prompts.map((prompt) => ({
      id: prompt.id,
      body: prompt.body,
      createdAt: prompt.createdAt.toISOString(),
      response:
        prompt.responseBody != null && prompt.responseUpdatedAt
          ? {
              body: prompt.responseBody,
              updatedAt: prompt.responseUpdatedAt.toISOString(),
              leaderReply: prompt.leaderReply,
              leaderRepliedAt: prompt.leaderRepliedAt?.toISOString() ?? null,
            }
          : null,
    })),
    prayerRequests,
  };
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export type DiscipleshipAdminOverview = {
  groupCount: number;
  groupsWithDisciples: number;
  activeDisciples: number;
  averageGroupSize: number;
  largestGroups: Array<{
    groupId: number;
    leaderName: string;
    leaderEmail: string;
    status: "active" | "archived";
    disciples: number;
    prompts: number;
  }>;
};

export async function getDiscipleshipAdminOverview(): Promise<DiscipleshipAdminOverview> {
  const [groupTotals, sizes, promptCounts] = await Promise.all([
    db.select({ n: count() }).from(schema.discipleshipGroups),
    db
      .select({
        groupId: schema.discipleshipMemberships.groupId,
        n: count(),
      })
      .from(schema.discipleshipMemberships)
      .where(eq(schema.discipleshipMemberships.status, "active"))
      .groupBy(schema.discipleshipMemberships.groupId),
    db
      .select({ groupId: schema.discipleshipPrompts.groupId, n: count() })
      .from(schema.discipleshipPrompts)
      .groupBy(schema.discipleshipPrompts.groupId),
  ]);

  const activeDisciples = sizes.reduce((sum, row) => sum + row.n, 0);
  const top = [...sizes].sort((a, b) => b.n - a.n).slice(0, 10);
  const promptsByGroup = new Map(promptCounts.map((row) => [row.groupId, row.n]));

  const leaders = top.length
    ? await db
        .select({
          groupId: schema.discipleshipGroups.id,
          status: schema.discipleshipGroups.status,
          leaderName: schema.sogpEnrollments.name,
          leaderEmail: schema.sogpEnrollments.email,
        })
        .from(schema.discipleshipGroups)
        .innerJoin(
          schema.sogpEnrollments,
          eq(schema.sogpEnrollments.id, schema.discipleshipGroups.leaderEnrollmentId),
        )
        .where(
          inArray(
            schema.discipleshipGroups.id,
            top.map((row) => row.groupId),
          ),
        )
    : [];
  const leaderByGroup = new Map(leaders.map((row) => [row.groupId, row]));

  return {
    groupCount: groupTotals[0]?.n ?? 0,
    groupsWithDisciples: sizes.length,
    activeDisciples,
    averageGroupSize: sizes.length ? Math.round((activeDisciples / sizes.length) * 10) / 10 : 0,
    largestGroups: top.flatMap((row) => {
      const leader = leaderByGroup.get(row.groupId);
      if (!leader) return [];
      return [
        {
          groupId: row.groupId,
          leaderName: leader.leaderName,
          leaderEmail: leader.leaderEmail,
          status: leader.status,
          disciples: row.n,
          prompts: promptsByGroup.get(row.groupId) ?? 0,
        },
      ];
    }),
  };
}

export async function setDiscipleshipGroupStatus(
  groupId: number,
  status: "active" | "archived",
) {
  await db
    .update(schema.discipleshipGroups)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.discipleshipGroups.id, groupId));
}

// ─── Nudges and contact log ─────────────────────────────────────────────────

/** The leader's active disciple for `membershipId`, or a friendly error. */
async function requireLeaderMembership(leaderEnrollmentId: number, membershipId: number) {
  const group = await requireActiveGroup(leaderEnrollmentId);
  const [row] = await db
    .select({
      membershipId: schema.discipleshipMemberships.id,
      discipleUserId: schema.sogpEnrollments.userId,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
    })
    .from(schema.discipleshipMemberships)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipMemberships.discipleEnrollmentId),
    )
    .where(
      and(
        eq(schema.discipleshipMemberships.id, membershipId),
        eq(schema.discipleshipMemberships.groupId, group.id),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    )
    .limit(1);
  if (!row) throw new DiscipleshipError("This disciple is no longer in your group.");
  return { ...row, firstName: firstNameOf(row.firstName || row.name) };
}

async function recordContact(input: {
  membershipId: number;
  kind: ContactKind;
  note: string | null;
}) {
  await db.insert(schema.discipleshipContactLogs).values(input);
  await db
    .update(schema.discipleshipMemberships)
    .set({
      lastContactedAt: new Date(),
      contactCount: sql`${schema.discipleshipMemberships.contactCount} + 1`,
    })
    .where(eq(schema.discipleshipMemberships.id, input.membershipId));
}

/** One preset nudge per disciple per Lagos day; returns what to send. */
export async function sendDiscipleNudge(input: {
  leaderEnrollmentId: number;
  membershipId: number;
  nudgeKey: string;
  personalNote: string;
}) {
  const nudge = findDiscipleshipNudge(input.nudgeKey);
  if (!nudge) throw new DiscipleshipError("Choose an encouragement to send.");
  const membership = await requireLeaderMembership(input.leaderEnrollmentId, input.membershipId);

  const [claimed] = await db
    .insert(schema.notificationCheckpoints)
    .values({
      key: nudgeCheckpointKey(membership.membershipId, toLagosDateKey(new Date())),
      value: nudge.key,
    })
    .onConflictDoNothing()
    .returning({ key: schema.notificationCheckpoints.key });
  if (!claimed) {
    throw new DiscipleshipError(
      `You've already encouraged ${membership.firstName} today. Try again tomorrow.`,
    );
  }

  const message = input.personalNote ? `${nudge.text} ${input.personalNote}` : nudge.text;
  await recordContact({ membershipId: membership.membershipId, kind: "nudge", note: message });
  return { discipleUserId: membership.discipleUserId, message };
}

export async function logDiscipleContact(input: {
  leaderEnrollmentId: number;
  membershipId: number;
  kind: DiscipleshipManualContactKind | "whatsapp";
  note: string | null;
}) {
  const membership = await requireLeaderMembership(input.leaderEnrollmentId, input.membershipId);
  await recordContact({ membershipId: membership.membershipId, kind: input.kind, note: input.note });
}

// ─── Prayer requests ────────────────────────────────────────────────────────

/**
 * Open requests plus recently answered ones. The leader's list is limited to
 * current disciples, so leaving the group hides a disciple's requests.
 */
async function listPrayerRequests(input: {
  groupId: number;
  discipleEnrollmentId?: number;
}): Promise<DiscipleshipPrayerRequest[]> {
  const answeredSince = new Date(Date.now() - ANSWERED_PRAYER_WINDOW_DAYS * DAY_MS);
  const rows = await db
    .select({
      id: schema.discipleshipPrayerRequests.id,
      body: schema.discipleshipPrayerRequests.body,
      status: schema.discipleshipPrayerRequests.status,
      answerNote: schema.discipleshipPrayerRequests.answerNote,
      prayedAt: schema.discipleshipPrayerRequests.prayedAt,
      answeredAt: schema.discipleshipPrayerRequests.answeredAt,
      createdAt: schema.discipleshipPrayerRequests.createdAt,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
    })
    .from(schema.discipleshipPrayerRequests)
    .innerJoin(
      schema.discipleshipMemberships,
      and(
        eq(
          schema.discipleshipMemberships.discipleEnrollmentId,
          schema.discipleshipPrayerRequests.discipleEnrollmentId,
        ),
        eq(schema.discipleshipMemberships.groupId, input.groupId),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    )
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipPrayerRequests.discipleEnrollmentId),
    )
    .where(
      and(
        eq(schema.discipleshipPrayerRequests.groupId, input.groupId),
        input.discipleEnrollmentId
          ? eq(schema.discipleshipPrayerRequests.discipleEnrollmentId, input.discipleEnrollmentId)
          : undefined,
        or(
          eq(schema.discipleshipPrayerRequests.status, "open"),
          gte(schema.discipleshipPrayerRequests.answeredAt, answeredSince),
        ),
      ),
    )
    .orderBy(desc(schema.discipleshipPrayerRequests.createdAt))
    .limit(30);

  return rows.map((row) => ({
    id: row.id,
    discipleFirstName: firstNameOf(row.firstName || row.name),
    body: row.body,
    status: row.status,
    answerNote: row.answerNote,
    prayedAt: row.prayedAt?.toISOString() ?? null,
    answeredAt: row.answeredAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }));
}

function getGroupPrayerRequests(groupId: number) {
  return listPrayerRequests({ groupId });
}

async function getLeaderUserIdForGroup(groupId: number) {
  const [row] = await db
    .select({ userId: schema.sogpEnrollments.userId })
    .from(schema.discipleshipGroups)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipGroups.leaderEnrollmentId),
    )
    .where(eq(schema.discipleshipGroups.id, groupId))
    .limit(1);
  return row?.userId ?? null;
}

export async function createPrayerRequest(input: {
  discipleEnrollmentId: number;
  body: string;
}) {
  const membership = await getActiveMembership(input.discipleEnrollmentId);
  if (!membership) throw new DiscipleshipError("Join a discipleship group to share prayer requests.");
  await db.insert(schema.discipleshipPrayerRequests).values({
    groupId: membership.groupId,
    discipleEnrollmentId: input.discipleEnrollmentId,
    body: input.body,
  });
  return { leaderUserId: await getLeaderUserIdForGroup(membership.groupId) };
}

export async function markPrayerRequestPrayed(input: {
  leaderEnrollmentId: number;
  requestId: number;
}) {
  const group = await requireActiveGroup(input.leaderEnrollmentId);
  const [row] = await db
    .select({ discipleUserId: schema.sogpEnrollments.userId })
    .from(schema.discipleshipPrayerRequests)
    .innerJoin(
      schema.discipleshipMemberships,
      and(
        eq(
          schema.discipleshipMemberships.discipleEnrollmentId,
          schema.discipleshipPrayerRequests.discipleEnrollmentId,
        ),
        eq(schema.discipleshipMemberships.groupId, group.id),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    )
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipPrayerRequests.discipleEnrollmentId),
    )
    .where(
      and(
        eq(schema.discipleshipPrayerRequests.id, input.requestId),
        eq(schema.discipleshipPrayerRequests.groupId, group.id),
      ),
    )
    .limit(1);
  if (!row) throw new DiscipleshipError("This prayer request isn't available.");

  const [updated] = await db
    .update(schema.discipleshipPrayerRequests)
    .set({ prayedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(schema.discipleshipPrayerRequests.id, input.requestId),
        isNull(schema.discipleshipPrayerRequests.prayedAt),
      ),
    )
    .returning({ id: schema.discipleshipPrayerRequests.id });
  // Only the first "prayed" notifies the disciple.
  return { discipleUserId: updated ? row.discipleUserId : null };
}

export async function markPrayerRequestAnswered(input: {
  discipleEnrollmentId: number;
  requestId: number;
  answerNote: string | null;
}) {
  const [updated] = await db
    .update(schema.discipleshipPrayerRequests)
    .set({
      status: "answered",
      answerNote: input.answerNote,
      answeredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.discipleshipPrayerRequests.id, input.requestId),
        eq(schema.discipleshipPrayerRequests.discipleEnrollmentId, input.discipleEnrollmentId),
        eq(schema.discipleshipPrayerRequests.status, "open"),
      ),
    )
    .returning({ groupId: schema.discipleshipPrayerRequests.groupId });
  if (!updated) throw new DiscipleshipError("This prayer request isn't available.");

  const membership = await getActiveMembership(input.discipleEnrollmentId);
  const stillInGroup = membership?.groupId === updated.groupId;
  return { leaderUserId: stillInGroup ? await getLeaderUserIdForGroup(updated.groupId) : null };
}

export async function deletePrayerRequest(input: {
  discipleEnrollmentId: number;
  requestId: number;
}) {
  await db
    .delete(schema.discipleshipPrayerRequests)
    .where(
      and(
        eq(schema.discipleshipPrayerRequests.id, input.requestId),
        eq(schema.discipleshipPrayerRequests.discipleEnrollmentId, input.discipleEnrollmentId),
      ),
    );
}

// ─── Curriculum-aligned check-in suggestions ───────────────────────────────

/**
 * Suggestions from teachings released in the last week, for the cohort most
 * of the group is in (or the leader's own cohort for an empty group).
 */
async function getPromptSuggestions(groupId: number, leaderCohortId: number) {
  const cohortRows = await db
    .select({ cohortId: schema.sogpEnrollments.cohortId, n: count() })
    .from(schema.discipleshipMemberships)
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipMemberships.discipleEnrollmentId),
    )
    .where(
      and(
        eq(schema.discipleshipMemberships.groupId, groupId),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    )
    .groupBy(schema.sogpEnrollments.cohortId)
    .orderBy(desc(count()))
    .limit(1);
  const cohortId = cohortRows[0]?.cohortId ?? leaderCohortId;

  const now = new Date();
  const tracks = await db
    .select({
      title: schema.lessons.title,
      curriculumLevel: schema.sogpCohortTracks.curriculumLevel,
    })
    .from(schema.sogpCohortTracks)
    .innerJoin(schema.lessons, eq(schema.lessons.id, schema.sogpCohortTracks.lessonId))
    .where(
      and(
        eq(schema.sogpCohortTracks.cohortId, cohortId),
        lte(schema.sogpCohortTracks.releaseAt, now),
        gte(schema.sogpCohortTracks.releaseAt, new Date(now.getTime() - 7 * DAY_MS)),
      ),
    )
    .orderBy(desc(schema.sogpCohortTracks.releaseAt))
    .limit(2);

  const level = tracks[0]?.curriculumLevel;
  const levelTitle =
    level && level >= 1 && level <= 4
      ? (getSogpLevel(level as SogpCurriculumLevel)?.title ?? null)
      : null;
  return {
    levelTitle,
    suggestions: buildCurriculumPromptSuggestions({
      levelTitle,
      teachingTitles: tracks.map((track) => track.title),
    }),
  };
}

// ─── Daily cron: status alerts and Monday digest ────────────────────────────

/** Claims a checkpoint key; false when it was already used. */
async function claimCheckpoint(key: string, value: string) {
  const [claimed] = await db
    .insert(schema.notificationCheckpoints)
    .values({ key, value })
    .onConflictDoNothing()
    .returning({ key: schema.notificationCheckpoints.key });
  return Boolean(claimed);
}

/**
 * Runs from the daily SOGP cron. Alerts disciplers when a disciple slips into
 * (or recovers from) an at-risk / not-active status, and sends a weekly group
 * digest on Mondays. Checkpoints make re-runs on the same day no-ops.
 */
export async function runDiscipleshipCron(now = new Date()) {
  const dateKey = toLagosDateKey(now);
  const members = await db
    .select({
      membershipId: schema.discipleshipMemberships.id,
      groupId: schema.discipleshipMemberships.groupId,
      joinedAt: schema.discipleshipMemberships.joinedAt,
      lastKnownStatus: schema.discipleshipMemberships.lastKnownStatus,
      enrollmentId: schema.sogpEnrollments.id,
      cohortId: schema.sogpEnrollments.cohortId,
      enrollmentCreatedAt: schema.sogpEnrollments.createdAt,
      name: schema.sogpEnrollments.name,
      firstName: schema.sogpEnrollments.firstName,
    })
    .from(schema.discipleshipMemberships)
    .innerJoin(
      schema.discipleshipGroups,
      eq(schema.discipleshipGroups.id, schema.discipleshipMemberships.groupId),
    )
    .innerJoin(
      schema.sogpEnrollments,
      eq(schema.sogpEnrollments.id, schema.discipleshipMemberships.discipleEnrollmentId),
    )
    .where(
      and(
        eq(schema.discipleshipMemberships.status, "active"),
        eq(schema.discipleshipGroups.status, "active"),
      ),
    );
  if (members.length === 0) return { alerts: 0, digests: 0 };

  const groupIds = [...new Set(members.map((m) => m.groupId))];
  const [statuses, leaders] = await Promise.all([
    getStudentStatusesForEnrollments(
      members.map((m) => ({
        enrollmentId: m.enrollmentId,
        cohortId: m.cohortId,
        enrollmentCreatedAt: m.enrollmentCreatedAt,
      })),
    ),
    db
      .select({ groupId: schema.discipleshipGroups.id, userId: schema.sogpEnrollments.userId })
      .from(schema.discipleshipGroups)
      .innerJoin(
        schema.sogpEnrollments,
        eq(schema.sogpEnrollments.id, schema.discipleshipGroups.leaderEnrollmentId),
      )
      .where(inArray(schema.discipleshipGroups.id, groupIds)),
  ]);
  const leaderByGroup = new Map(leaders.map((row) => [row.groupId, row.userId]));

  let alerts = 0;
  for (const member of members) {
    const status = statuses.get(member.enrollmentId);
    if (!status) continue;
    const leaderUserId = leaderByGroup.get(member.groupId);
    const alert = shouldAlertStatusChange(member.lastKnownStatus, status);

    if (alert && leaderUserId) {
      const claimed = await claimCheckpoint(
        `discipleship-alert:${member.membershipId}:${dateKey}`,
        `${alert}:${status}`,
      );
      if (claimed) {
        const firstName = firstNameOf(member.firstName || member.name);
        const message = buildStatusAlertBody(firstName, status, alert);
        await notifyDiscipleship({
          kind: "discipleship_alert",
          recipientUserIds: [leaderUserId],
          actorUserId: null,
          actorFirstName: firstName,
          pushBody: message,
          payload: { message },
        }).catch((error) => console.error("Discipleship alert failed:", error));
        alerts += 1;
      }
    }

    if (member.lastKnownStatus !== status) {
      await db
        .update(schema.discipleshipMemberships)
        .set({ lastKnownStatus: status })
        .where(eq(schema.discipleshipMemberships.id, member.membershipId));
    }
  }

  let digests = 0;
  if (isDigestDay(now)) {
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);
    const [prompts, responses, prayerCounts] = await Promise.all([
      db
        .select({
          id: schema.discipleshipPrompts.id,
          groupId: schema.discipleshipPrompts.groupId,
          createdAt: schema.discipleshipPrompts.createdAt,
        })
        .from(schema.discipleshipPrompts)
        .where(
          and(
            inArray(schema.discipleshipPrompts.groupId, groupIds),
            gte(schema.discipleshipPrompts.createdAt, weekAgo),
          ),
        ),
      db
        .select({
          promptId: schema.discipleshipPromptResponses.promptId,
          enrollmentId: schema.discipleshipPromptResponses.discipleEnrollmentId,
        })
        .from(schema.discipleshipPromptResponses)
        .innerJoin(
          schema.discipleshipPrompts,
          eq(schema.discipleshipPrompts.id, schema.discipleshipPromptResponses.promptId),
        )
        .where(
          and(
            inArray(schema.discipleshipPrompts.groupId, groupIds),
            gte(schema.discipleshipPrompts.createdAt, weekAgo),
          ),
        ),
      db
        .select({ groupId: schema.discipleshipPrayerRequests.groupId, n: count() })
        .from(schema.discipleshipPrayerRequests)
        .where(
          and(
            inArray(schema.discipleshipPrayerRequests.groupId, groupIds),
            eq(schema.discipleshipPrayerRequests.status, "open"),
          ),
        )
        .groupBy(schema.discipleshipPrayerRequests.groupId),
    ]);
    const answered = new Set(responses.map((r) => `${r.promptId}:${r.enrollmentId}`));
    const openPrayerByGroup = new Map(prayerCounts.map((row) => [row.groupId, row.n]));

    for (const groupId of groupIds) {
      const leaderUserId = leaderByGroup.get(groupId);
      if (!leaderUserId) continue;
      const groupMembers = members.filter((m) => m.groupId === groupId);
      // A check-in answer is outstanding for each current member who was in the
      // group when it was sent and hasn't answered yet.
      const unansweredCheckIns = prompts
        .filter((prompt) => prompt.groupId === groupId)
        .reduce(
          (total, prompt) =>
            total +
            groupMembers.filter(
              (m) => m.joinedAt <= prompt.createdAt && !answered.has(`${prompt.id}:${m.enrollmentId}`),
            ).length,
          0,
        );
      const digest = buildWeeklyDigest({
        statuses: groupMembers.map((m) => statuses.get(m.enrollmentId) ?? null),
        unansweredCheckIns,
        openPrayerRequests: openPrayerByGroup.get(groupId) ?? 0,
      });
      if (!digest) continue;
      if (!(await claimCheckpoint(`discipleship-digest:${groupId}:${dateKey}`, "sent"))) continue;

      await notifyDiscipleship({
        kind: "discipleship_digest",
        recipientUserIds: [leaderUserId],
        actorUserId: null,
        actorFirstName: "",
        pushBody: digest.body,
        payload: { message: digest.body },
      }).catch((error) => console.error("Discipleship digest failed:", error));
      digests += 1;
    }
  }

  return { alerts, digests };
}
