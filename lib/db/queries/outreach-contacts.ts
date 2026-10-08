import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  ne,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import { CommunityError } from "@/lib/community/errors";
import {
  activitySummary,
  type ActivityKind,
} from "@/lib/community/ministry-activities";
import type {
  ContactOutcomes,
  ContactUpdate,
  DiscipleshipStatus,
  InteractionInput,
  InteractionKind,
  SalvationStatus,
} from "@/lib/community/outreach-contacts";

import { inUnit } from "./community-scope";
import {
  contactInteractionCount,
  contactLastInteractionDate,
  contactLastInteractionKind,
} from "./ministry-sql";

/**
 * People members met in ministry, kept as lasting records with their
 * statuses and every interaction since. They are outside Pleros, so every
 * read here is scoped: a member's own list, one location group for its
 * assigned pastor, or everything for admins. Callers check the viewer with
 * `canSeeOutreachContact` before a write.
 */

const contacts = schema.outreachContacts;
const interactions = schema.outreachContactInteractions;
const followUpUser = alias(schema.users, "follow_up_user");
const metInteraction = alias(interactions, "met_interaction");

/** A transaction handle from `transactionDb.transaction`, shared with the activity queries. */
export type Tx = Parameters<Parameters<typeof transactionDb.transaction>[0]>[0];

export type OutreachContact = {
  id: number;
  /** The Lagos day they were first met. */
  metDate: string;
  /** The outreach they were met at, when it still exists. */
  activityId: number | null;
  name: string;
  phone: string | null;
  note: string | null;
  salvationStatus: SalvationStatus;
  discipleshipStatus: DiscipleshipStatus;
  followUpPlan: string | null;
  nextFollowUpDate: string | null;
  /** When first followed up; null while still to be followed up. */
  followedUpAt: string | null;
  /** Who first followed them up. */
  followedUpByName: string | null;
  /** @deprecated Older follow-up notes now live in the interaction history. */
  followUpNote: string | null;
  interactionCount: number;
  lastInteractionDate: string | null;
  lastInteractionKind: InteractionKind | null;
};

const contactColumns = {
  id: contacts.id,
  metDate: contacts.metDate,
  activityId: contacts.activityId,
  name: contacts.name,
  phone: contacts.phone,
  note: contacts.note,
  salvationStatus: contacts.salvationStatus,
  discipleshipStatus: contacts.discipleshipStatus,
  followUpPlan: contacts.followUpPlan,
  nextFollowUpDate: contacts.nextFollowUpDate,
  followedUpAt: contacts.followedUpAt,
  followUpNote: contacts.followUpNote,
  followedUpByName: followUpUser.name,
  interactionCount: contactInteractionCount,
  lastInteractionDate: contactLastInteractionDate,
  lastInteractionKind: contactLastInteractionKind,
};

type ContactRecord = Omit<OutreachContact, "followedUpAt"> & { followedUpAt: Date | null };

function toContact(row: ContactRecord): OutreachContact {
  return { ...row, followedUpAt: row.followedUpAt?.toISOString() ?? null };
}

function outcomesOf(row: {
  saved: boolean | null;
  filled: boolean | null;
  healed: boolean | null;
}): ContactOutcomes {
  return { saved: row.saved ?? false, filled: row.filled ?? false, healed: row.healed ?? false };
}

// ─── A member's own list ───────────────────────────────────────────────────

/** The newest people a member recorded, across every day. */
export async function listContactsForMember(
  userId: string,
  limit = 300,
): Promise<OutreachContact[]> {
  const rows = await db
    .select(contactColumns)
    .from(contacts)
    .leftJoin(followUpUser, eq(followUpUser.id, contacts.followedUpBy))
    .where(eq(contacts.userId, userId))
    .orderBy(desc(contacts.metDate), desc(contacts.id))
    .limit(limit);
  return rows.map(toContact);
}

/** A person met at an outreach, with what happened to them there. */
export type ActivityPerson = OutreachContact & { outcomes: ContactOutcomes };

/** The people a member met at one outreach, in the order they were added. */
export async function listContactsForActivity(
  userId: string,
  activityId: number,
): Promise<ActivityPerson[]> {
  const rows = await db
    .select({
      ...contactColumns,
      saved: metInteraction.saved,
      filled: metInteraction.filled,
      healed: metInteraction.healed,
    })
    .from(contacts)
    .leftJoin(followUpUser, eq(followUpUser.id, contacts.followedUpBy))
    .leftJoin(
      metInteraction,
      and(
        eq(metInteraction.contactId, contacts.id),
        eq(metInteraction.activityId, activityId),
        eq(metInteraction.kind, "met"),
      ),
    )
    .where(and(eq(contacts.userId, userId), eq(contacts.activityId, activityId)))
    .orderBy(asc(contacts.id));
  return rows.map(({ saved, filled, healed, ...row }) => ({
    ...toContact(row),
    outcomes: outcomesOf({ saved, filled, healed }),
  }));
}

// ─── Shared transaction steps ──────────────────────────────────────────────

/**
 * Deletes a member's people and their whole history. Refused when someone
 * else (their pastor or the Pleros team) has logged a follow-up with one of
 * them, so that record is not lost by accident.
 */
export async function removeContacts(tx: Tx, userId: string, contactIds: number[]) {
  if (contactIds.length === 0) return;
  const [other] = await tx
    .select({ id: interactions.id })
    .from(interactions)
    .where(
      and(
        inArray(interactions.contactId, contactIds),
        isNotNull(interactions.userId),
        ne(interactions.userId, userId),
      ),
    )
    .limit(1);
  if (other) {
    throw new CommunityError(
      "Your pastor or the Pleros team has logged a follow-up with one of these people. Ask them before removing them.",
    );
  }
  await tx
    .delete(contacts)
    .where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)));
}

/** Records that these people gave their lives to Christ, never downgrading a believer. */
export async function markContactsSaved(tx: Tx, contactIds: number[]) {
  if (contactIds.length === 0) return;
  await tx
    .update(contacts)
    .set({ salvationStatus: "saved", updatedAt: new Date() })
    .where(
      and(
        inArray(contacts.id, contactIds),
        inArray(contacts.salvationStatus, ["unknown", "not_saved"]),
      ),
    );
}

/**
 * Recomputes when each person was first followed up and by whom from their
 * interactions (anything that is not `met`). Run after interactions are
 * added or removed.
 */
export async function syncContactFollowUp(tx: Tx, contactIds: number[]) {
  const ids = [...new Set(contactIds)];
  if (ids.length === 0) return;
  const idList = sql.join(
    ids.map((id) => sql`${id}`),
    sql`, `,
  );
  await tx.execute(sql`
    update ${contacts} as c
    set followed_up_at = f.first_at,
        followed_up_by = f.first_by,
        updated_at = now()
    from (
      select contact_id,
             min(created_at) as first_at,
             (array_agg(user_id order by created_at, id))[1] as first_by
      from ${interactions}
      where kind <> 'met' and contact_id in (${idList})
      group by contact_id
    ) as f
    where c.id = f.contact_id
  `);
  await tx.execute(sql`
    update ${contacts}
    set followed_up_at = null,
        followed_up_by = null,
        updated_at = now()
    where id in (${idList})
      and not exists (
        select 1 from ${interactions} as i
        where i.contact_id = ${contacts}.id and i.kind <> 'met'
      )
  `);
}

/** A member removes one of their own people, with their history. */
export async function deleteOwnContact(userId: string, contactId: number) {
  await transactionDb.transaction(async (tx) => {
    await removeContacts(tx, userId, [contactId]);
  });
}

// ─── Who owns a person or an interaction ───────────────────────────────────

/** Who recorded a contact and which location groups that member belongs to. */
export async function getContactOwner(
  contactId: number,
): Promise<{ userId: string; unitIds: number[] } | null> {
  const [contact] = await db
    .select({ userId: contacts.userId })
    .from(contacts)
    .where(eq(contacts.id, contactId))
    .limit(1);
  if (!contact) return null;

  const units = await db
    .select({ unitId: schema.unitMembers.unitId })
    .from(schema.sogpEnrollments)
    .innerJoin(
      schema.unitMembers,
      eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
    )
    .where(eq(schema.sogpEnrollments.userId, contact.userId));
  return { userId: contact.userId, unitIds: units.map((unit) => unit.unitId) };
}

export async function getInteractionOwner(
  interactionId: number,
): Promise<{ contactId: number; userId: string | null; kind: InteractionKind } | null> {
  const [row] = await db
    .select({
      contactId: interactions.contactId,
      userId: interactions.userId,
      kind: interactions.kind,
    })
    .from(interactions)
    .where(eq(interactions.id, interactionId))
    .limit(1);
  return row ?? null;
}

// ─── One person in detail ──────────────────────────────────────────────────

export type ContactInteraction = {
  id: number;
  interactionDate: string;
  kind: InteractionKind;
  outcomes: ContactOutcomes;
  note: string | null;
  /** Who logged it; null once that account is gone. */
  userId: string | null;
  userName: string | null;
  /** The activity it was logged through, when it still exists. */
  activity: { id: number; summary: string } | null;
};

export type ContactDetail = OutreachContact & {
  memberName: string;
  interactions: ContactInteraction[];
};

/** Most interactions shown for one person. */
const INTERACTION_LIMIT = 200;

/** A person with their whole history, newest touch first. */
export async function getContactDetail(contactId: number): Promise<ContactDetail | null> {
  const [contact] = await db
    .select({ ...contactColumns, memberName: schema.users.name })
    .from(contacts)
    .innerJoin(schema.users, eq(schema.users.id, contacts.userId))
    .leftJoin(followUpUser, eq(followUpUser.id, contacts.followedUpBy))
    .where(eq(contacts.id, contactId))
    .limit(1);
  if (!contact) return null;

  const activities = schema.ministryActivities;
  const rows = await db
    .select({
      id: interactions.id,
      interactionDate: interactions.interactionDate,
      kind: interactions.kind,
      saved: interactions.saved,
      filled: interactions.filled,
      healed: interactions.healed,
      note: interactions.note,
      userId: interactions.userId,
      userName: schema.users.name,
      activityId: activities.id,
      activityKind: activities.kind,
      activityTitle: activities.title,
      activityMode: activities.mode,
      activityPlatform: activities.platform,
      activityLocation: activities.location,
    })
    .from(interactions)
    .leftJoin(schema.users, eq(schema.users.id, interactions.userId))
    .leftJoin(activities, eq(activities.id, interactions.activityId))
    .where(eq(interactions.contactId, contactId))
    .orderBy(desc(interactions.interactionDate), desc(interactions.id))
    .limit(INTERACTION_LIMIT);

  const { memberName, ...record } = contact;
  return {
    ...toContact(record),
    memberName,
    interactions: rows.map((row) => ({
      id: row.id,
      interactionDate: row.interactionDate,
      kind: row.kind,
      outcomes: outcomesOf(row),
      note: row.note,
      userId: row.userId,
      userName: row.userName,
      activity:
        row.activityId != null && row.activityKind
          ? {
              id: row.activityId,
              summary: activitySummary({
                kind: row.activityKind as ActivityKind,
                title: row.activityTitle,
                mode: row.activityMode,
                platform: row.activityPlatform,
                location: row.activityLocation,
              }),
            }
          : null,
    })),
  };
}

/** Changes a person's statuses, plan and next follow-up date. */
export async function updateContact(contactId: number, patch: ContactUpdate) {
  await db
    .update(contacts)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(contacts.id, contactId));
}

/**
 * Logs a follow-up with a person. The first one marks them followed up; a
 * salvation outcome records that they gave their life to Christ.
 */
export async function addContactInteraction(
  contactId: number,
  input: InteractionInput & { userId: string },
): Promise<{ id: number }> {
  return transactionDb.transaction(async (tx) => {
    const [row] = await tx
      .insert(interactions)
      .values({
        contactId,
        userId: input.userId,
        activityId: null,
        interactionDate: input.interactionDate,
        kind: input.kind,
        ...input.outcomes,
        note: input.note,
      })
      .returning({ id: interactions.id });
    await tx
      .update(contacts)
      .set({
        followedUpAt: sql`coalesce(${contacts.followedUpAt}, now())`,
        followedUpBy: sql`coalesce(${contacts.followedUpBy}, ${input.userId})`,
        updatedAt: new Date(),
      })
      .where(eq(contacts.id, contactId));
    if (input.outcomes.saved) await markContactsSaved(tx, [contactId]);
    return { id: row.id };
  });
}

/** Removes one logged follow-up and recomputes when the person was first followed up. */
export async function deleteContactInteraction(interactionId: number) {
  await transactionDb.transaction(async (tx) => {
    const [row] = await tx
      .delete(interactions)
      .where(eq(interactions.id, interactionId))
      .returning({ contactId: interactions.contactId });
    if (row) await syncContactFollowUp(tx, [row.contactId]);
  });
}

// ─── Staff lists ───────────────────────────────────────────────────────────

export type StaffOutreachContact = OutreachContact & {
  /** The member who met them. */
  memberName: string;
};

/**
 * People met between two Lagos date keys, with the member who met them. Pass
 * `unitId` for one location group (its assigned pastor), `memberUserId` for
 * one member, or neither for everyone (admins only).
 */
export async function listContactsForStaff({
  fromKey,
  toKey,
  unitId,
  memberUserId,
  pendingOnly = false,
  limit = 500,
}: {
  fromKey: string;
  toKey: string;
  unitId?: number | null;
  memberUserId?: string | null;
  pendingOnly?: boolean;
  limit?: number;
}): Promise<StaffOutreachContact[]> {
  const rows = await db
    .select({ ...contactColumns, memberName: schema.users.name })
    .from(contacts)
    .innerJoin(schema.users, eq(schema.users.id, contacts.userId))
    .leftJoin(followUpUser, eq(followUpUser.id, contacts.followedUpBy))
    .where(
      and(
        gte(contacts.metDate, fromKey),
        lte(contacts.metDate, toKey),
        inUnit(contacts.userId, unitId),
        memberUserId ? eq(contacts.userId, memberUserId) : undefined,
        pendingOnly ? isNull(contacts.followedUpAt) : undefined,
      ),
    )
    .orderBy(desc(contacts.metDate), desc(contacts.id))
    .limit(limit);

  return rows.map(({ memberName, ...row }) => ({ ...toContact(row), memberName }));
}

export type StaffInteraction = {
  interactionDate: string;
  kind: InteractionKind;
  outcomes: ContactOutcomes;
  note: string | null;
  contactName: string;
  contactPhone: string | null;
  /** The member who met the person. */
  memberName: string;
  /** Who logged this touch. */
  loggedByName: string | null;
};

/** Every interaction in a range, for the admin export. Carries names and numbers. */
export async function listInteractionsForStaff({
  fromKey,
  toKey,
  unitId,
  limit = 500,
}: {
  fromKey: string;
  toKey: string;
  unitId?: number | null;
  limit?: number;
}): Promise<StaffInteraction[]> {
  const loggedBy = alias(schema.users, "logged_by");
  const rows = await db
    .select({
      interactionDate: interactions.interactionDate,
      kind: interactions.kind,
      saved: interactions.saved,
      filled: interactions.filled,
      healed: interactions.healed,
      note: interactions.note,
      contactName: contacts.name,
      contactPhone: contacts.phone,
      memberName: schema.users.name,
      loggedByName: loggedBy.name,
    })
    .from(interactions)
    .innerJoin(contacts, eq(contacts.id, interactions.contactId))
    .innerJoin(schema.users, eq(schema.users.id, contacts.userId))
    .leftJoin(loggedBy, eq(loggedBy.id, interactions.userId))
    .where(
      and(
        gte(interactions.interactionDate, fromKey),
        lte(interactions.interactionDate, toKey),
        inUnit(contacts.userId, unitId),
      ),
    )
    .orderBy(desc(interactions.interactionDate), desc(interactions.id))
    .limit(limit);

  return rows.map(({ saved, filled, healed, ...row }) => ({
    ...row,
    outcomes: outcomesOf({ saved, filled, healed }),
  }));
}
