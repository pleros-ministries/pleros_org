import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { CommunityError } from "@/lib/community/errors";
import { phoneHref } from "@/lib/community/outreach-contacts";
import { db } from "@/lib/db";
import * as s from "@/lib/db/schema";
import { buildWhatsAppUrl } from "@/lib/sogp/discipleship";

export const FOLLOW_UP_KINDS = ["whatsapp", "call", "visit", "message", "note"] as const;
export type FollowUpKind = (typeof FOLLOW_UP_KINDS)[number];
export const FOLLOW_UP_NOTE_MAX = 500;

export type FollowUpSubject = { enrollmentId: number } | { privateContactId: number };
export type FollowUpEntry = { id: number; kind: FollowUpKind; note: string | null; createdAt: string };

/** Postgres "relation does not exist": migration 0064 isn't applied yet. */
function missingTable(error: unknown) {
  const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "42P01";
}

/** True when the viewer owns this enrollee's follow-up or this private contact. */
async function ownsSubject(ownerUserId: string, subject: FollowUpSubject) {
  if ("enrollmentId" in subject) {
    const [row] = await db.select({ id: s.pastorAssignments.enrollmentId }).from(s.pastorAssignments)
      .where(and(eq(s.pastorAssignments.enrollmentId, subject.enrollmentId), eq(s.pastorAssignments.pastorUserId, ownerUserId))).limit(1);
    return Boolean(row);
  }
  const [row] = await db.select({ id: s.privateMinistryContacts.id }).from(s.privateMinistryContacts)
    .where(and(eq(s.privateMinistryContacts.id, subject.privateContactId), eq(s.privateMinistryContacts.userId, ownerUserId))).limit(1);
  return Boolean(row);
}

const subjectWhere = (subject: FollowUpSubject) => "enrollmentId" in subject
  ? eq(s.peopleFollowUpLogs.enrollmentId, subject.enrollmentId)
  : eq(s.peopleFollowUpLogs.privateContactId, subject.privateContactId);

/** The owner's own follow-ups with one person, newest first. Empty before migration 0064. */
export async function listFollowUps(ownerUserId: string, subject: FollowUpSubject): Promise<FollowUpEntry[]> {
  try {
    const rows = await db.select({ id: s.peopleFollowUpLogs.id, kind: s.peopleFollowUpLogs.kind, note: s.peopleFollowUpLogs.note, createdAt: s.peopleFollowUpLogs.createdAt })
      .from(s.peopleFollowUpLogs)
      .where(and(eq(s.peopleFollowUpLogs.ownerUserId, ownerUserId), subjectWhere(subject)))
      .orderBy(desc(s.peopleFollowUpLogs.createdAt))
      .limit(50);
    return rows.map(row => ({ ...row, createdAt: row.createdAt.toISOString() }));
  } catch (error) {
    if (missingTable(error)) return [];
    throw error;
  }
}

/**
 * Records one follow-up. For an enrollee it also bumps the assignment's
 * last-contact date and count, which My enrollees and the pastor views read.
 */
export async function logFollowUp(ownerUserId: string, subject: FollowUpSubject, input: { kind: unknown; note: unknown }) {
  const kind = FOLLOW_UP_KINDS.find(item => item === input.kind);
  if (!kind) throw new CommunityError("Choose how you followed up.");
  const note = typeof input.note === "string" ? input.note.trim() : "";
  if (note.length > FOLLOW_UP_NOTE_MAX) throw new CommunityError(`Keep the note under ${FOLLOW_UP_NOTE_MAX} characters.`);
  if (!(await ownsSubject(ownerUserId, subject))) throw new CommunityError("You can only log follow-ups for people you look after.");
  try {
    await db.insert(s.peopleFollowUpLogs).values({
      ownerUserId,
      enrollmentId: "enrollmentId" in subject ? subject.enrollmentId : null,
      privateContactId: "privateContactId" in subject ? subject.privateContactId : null,
      kind,
      note: note || null,
    });
  } catch (error) {
    if (missingTable(error)) throw new CommunityError("The follow-up log isn't switched on yet. Try again later.");
    throw error;
  }
  if ("enrollmentId" in subject) {
    await db.update(s.pastorAssignments)
      .set({ contactCount: sql`${s.pastorAssignments.contactCount} + 1`, lastContactedAt: new Date() })
      .where(and(eq(s.pastorAssignments.enrollmentId, subject.enrollmentId), eq(s.pastorAssignments.pastorUserId, ownerUserId)));
  }
}

/** Remembers that the owner shared a group's invite with their contact. Silent before migration 0064. */
export async function recordContactInvite(ownerUserId: string, privateContactId: number, groupId: number) {
  const leader = alias(s.sogpEnrollments, "invite_leader");
  const [owned] = await db.select({ id: s.privateMinistryContacts.id }).from(s.privateMinistryContacts)
    .where(and(eq(s.privateMinistryContacts.id, privateContactId), eq(s.privateMinistryContacts.userId, ownerUserId))).limit(1);
  const [led] = await db.select({ id: s.discipleshipGroups.id }).from(s.discipleshipGroups)
    .innerJoin(leader, and(eq(leader.id, s.discipleshipGroups.leaderEnrollmentId), eq(leader.userId, ownerUserId)))
    .where(and(eq(s.discipleshipGroups.id, groupId), eq(s.discipleshipGroups.status, "active"))).limit(1);
  if (!owned || !led) throw new CommunityError("Choose one of your own contacts and groups.");
  try {
    await db.insert(s.privateContactInvites).values({ ownerUserId, privateContactId, groupId });
  } catch (error) {
    if (!missingTable(error)) throw error;
  }
}

/** The latest invite per contact, for the Saved contacts list. Empty before migration 0064. */
export async function listContactInviteStatus(ownerUserId: string): Promise<Map<number, { groupName: string; at: string }>> {
  try {
    const rows = await db.select({ contactId: s.privateContactInvites.privateContactId, groupName: s.discipleshipGroups.name, at: s.privateContactInvites.createdAt })
      .from(s.privateContactInvites)
      .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.privateContactInvites.groupId))
      .where(eq(s.privateContactInvites.ownerUserId, ownerUserId))
      .orderBy(desc(s.privateContactInvites.createdAt));
    const latest = new Map<number, { groupName: string; at: string }>();
    for (const row of rows) if (!latest.has(row.contactId)) latest.set(row.contactId, { groupName: row.groupName, at: row.at.toISOString() });
    return latest;
  } catch (error) {
    if (missingTable(error)) return new Map();
    throw error;
  }
}

export type OwnEnrollee = {
  enrollmentId: number;
  name: string;
  firstName: string;
  phone: string;
  whatsappUrl: string | null;
  callHref: string | null;
  cohortName: string;
  region: string;
  source: "code" | "link" | "geography" | "reassigned" | "assigned";
  assignedAt: string;
  lastContactedAt: string | null;
  contactCount: number;
  /** Their current discipleship group; the name only when it is the viewer's own. */
  group: { yours: boolean; name: string | null; groupId: number | null; membershipId: number | null } | null;
  /** A pending invitation into one of the viewer's groups. */
  invitation: { id: number; groupName: string; sentAt: string } | null;
};

/**
 * One enrollee whose follow-up the viewer owns, with the contact details the
 * owner needs to follow up (user decision, 17 October: owners see the phone
 * number, WhatsApp and call). Never reaches anyone else.
 */
export async function getOwnEnrollee(ownerUserId: string, enrollmentId: number): Promise<OwnEnrollee | null> {
  const [row] = await db.select({
    enrollmentId: s.sogpEnrollments.id, name: s.sogpEnrollments.name, firstName: s.sogpEnrollments.firstName,
    phone: s.sogpEnrollments.phone, countryCode: s.sogpEnrollments.countryCode, region: s.sogpEnrollments.region, country: s.sogpEnrollments.country,
    cohortName: s.sogpCohorts.title, assignedAt: s.pastorAssignments.assignedAt, assignedBy: s.pastorAssignments.assignedBy,
    lastContactedAt: s.pastorAssignments.lastContactedAt, contactCount: s.pastorAssignments.contactCount,
    routeSource: s.sogpFollowUpRoutes.source, routeOwner: s.sogpFollowUpRoutes.ownerUserId,
  }).from(s.pastorAssignments)
    .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.pastorAssignments.enrollmentId))
    .innerJoin(s.sogpCohorts, eq(s.sogpCohorts.id, s.sogpEnrollments.cohortId))
    .leftJoin(s.sogpFollowUpRoutes, eq(s.sogpFollowUpRoutes.enrollmentId, s.pastorAssignments.enrollmentId))
    .where(and(eq(s.pastorAssignments.enrollmentId, enrollmentId), eq(s.pastorAssignments.pastorUserId, ownerUserId)))
    .limit(1);
  if (!row) return null;

  const leader = alias(s.sogpEnrollments, "own_enrollee_leader");
  const [membership] = await db.select({ membershipId: s.discipleshipMemberships.id, groupId: s.discipleshipGroups.id, name: s.discipleshipGroups.name, leaderUserId: leader.userId })
    .from(s.discipleshipMemberships)
    .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipMemberships.groupId))
    .innerJoin(leader, eq(leader.id, s.discipleshipGroups.leaderEnrollmentId))
    .where(and(eq(s.discipleshipMemberships.discipleEnrollmentId, enrollmentId), eq(s.discipleshipMemberships.status, "active")))
    .limit(1);
  const [invitation] = membership ? [] : await db.select({ id: s.discipleshipGroupInvitations.id, groupName: s.discipleshipGroups.name, sentAt: s.discipleshipGroupInvitations.createdAt })
    .from(s.discipleshipGroupInvitations)
    .innerJoin(s.discipleshipGroups, eq(s.discipleshipGroups.id, s.discipleshipGroupInvitations.groupId))
    .innerJoin(leader, and(eq(leader.id, s.discipleshipGroups.leaderEnrollmentId), eq(leader.userId, ownerUserId)))
    .where(and(eq(s.discipleshipGroupInvitations.recipientEnrollmentId, enrollmentId), eq(s.discipleshipGroupInvitations.status, "pending")))
    .orderBy(desc(s.discipleshipGroupInvitations.createdAt))
    .limit(1);

  const first = (row.firstName || row.name).trim().split(/\s+/)[0] ?? row.name;
  const yours = membership?.leaderUserId === ownerUserId;
  return {
    enrollmentId: row.enrollmentId,
    name: row.name,
    firstName: first,
    phone: row.phone,
    whatsappUrl: buildWhatsAppUrl(row.phone, row.countryCode, `Hi ${first}, `),
    callHref: phoneHref(row.phone),
    cohortName: row.cohortName,
    region: row.region || row.country,
    source: row.routeSource && row.routeOwner === ownerUserId ? row.routeSource : row.assignedBy ? "reassigned" : "assigned",
    assignedAt: new Date(row.assignedAt).toISOString(),
    lastContactedAt: row.lastContactedAt ? new Date(row.lastContactedAt).toISOString() : null,
    contactCount: row.contactCount,
    group: membership ? { yours, name: yours ? membership.name : null, groupId: yours ? membership.groupId : null, membershipId: yours ? membership.membershipId : null } : null,
    invitation: invitation ? { id: invitation.id, groupName: invitation.groupName, sentAt: invitation.sentAt.toISOString() } : null,
  };
}

/** Phone links for the My enrollees rows, keyed by enrolment. Owner-only. */
export async function listOwnEnrolleeContacts(ownerUserId: string, enrollmentIds: number[]) {
  if (!enrollmentIds.length) return new Map<number, { whatsappUrl: string | null; callHref: string | null }>();
  const rows = await db.select({ id: s.sogpEnrollments.id, name: s.sogpEnrollments.name, firstName: s.sogpEnrollments.firstName, phone: s.sogpEnrollments.phone, countryCode: s.sogpEnrollments.countryCode })
    .from(s.pastorAssignments)
    .innerJoin(s.sogpEnrollments, eq(s.sogpEnrollments.id, s.pastorAssignments.enrollmentId))
    .where(and(eq(s.pastorAssignments.pastorUserId, ownerUserId), inArray(s.pastorAssignments.enrollmentId, enrollmentIds)));
  return new Map(rows.map(row => {
    const first = (row.firstName || row.name).trim().split(/\s+/)[0] ?? row.name;
    return [row.id, { whatsappUrl: buildWhatsAppUrl(row.phone, row.countryCode, `Hi ${first}, `), callHref: phoneHref(row.phone) }];
  }));
}
