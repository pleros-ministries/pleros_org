import { and, asc, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import type { MinistryReportInput } from "@/lib/community/ministry-report";
import type { ContactRow } from "@/lib/community/outreach-contacts";

/**
 * People members met in outreach, kept for follow-up. They are outside
 * Pleros, so every read here is scoped: a member's own list, one location
 * group for its assigned pastor, or everything for admins. Callers check the
 * viewer with `canSeeOutreachContact` before a write.
 */

const contacts = schema.outreachContacts;
const followUpUser = alias(schema.users, "follow_up_user");

export type OutreachContact = {
  id: number;
  metDate: string;
  name: string;
  phone: string | null;
  note: string | null;
  followedUpAt: string | null;
  followUpNote: string | null;
  /** Who marked them followed up, when it was not the member themselves. */
  followedUpByName: string | null;
};

const contactColumns = {
  id: contacts.id,
  metDate: contacts.metDate,
  name: contacts.name,
  phone: contacts.phone,
  note: contacts.note,
  followedUpAt: contacts.followedUpAt,
  followUpNote: contacts.followUpNote,
  followedUpByName: followUpUser.name,
};

type ContactRow = {
  id: number;
  metDate: string;
  name: string;
  phone: string | null;
  note: string | null;
  followedUpAt: Date | null;
  followUpNote: string | null;
  followedUpByName: string | null;
};

function toContact(row: ContactRow): OutreachContact {
  return { ...row, followedUpAt: row.followedUpAt?.toISOString() ?? null };
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

/** The people a member recorded for one day, in the order they were added. */
export async function listContactsForDay(
  userId: string,
  metDate: string,
): Promise<OutreachContact[]> {
  const rows = await db
    .select(contactColumns)
    .from(contacts)
    .leftJoin(followUpUser, eq(followUpUser.id, contacts.followedUpBy))
    .where(and(eq(contacts.userId, userId), eq(contacts.metDate, metDate)))
    .orderBy(asc(contacts.id));
  return rows.map(toContact);
}

/**
 * Saves a day's ministry report together with the people met that day, in one
 * transaction. `people` is the full list for the day as the form now has it:
 * rows with a known id are corrected in place (their follow-up state is left
 * alone), rows without one are added, and saved people no longer in the list
 * are removed.
 */
export async function saveReportWithContacts(input: {
  userId: string;
  reportDate: string;
  report: MinistryReportInput;
  people: ContactRow[];
}): Promise<void> {
  const { userId, reportDate, report, people } = input;
  const reports = schema.ministryReports;

  await transactionDb.transaction(async (tx) => {
    await tx
      .insert(reports)
      .values({ userId, reportDate, ...report })
      .onConflictDoUpdate({
        target: [reports.userId, reports.reportDate],
        set: { ...report, updatedAt: new Date() },
      });

    const saved = await tx
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.userId, userId), eq(contacts.metDate, reportDate)));
    const savedIds = new Set(saved.map((row) => row.id));

    // An id that is not one of this member's rows for this day is treated as new.
    const kept = people.filter(
      (person): person is ContactRow & { id: number } =>
        person.id != null && savedIds.has(person.id),
    );
    const added = people.filter(
      (person) => person.id == null || !savedIds.has(person.id),
    );
    const keptIds = new Set(kept.map((person) => person.id));
    const removedIds = [...savedIds].filter((id) => !keptIds.has(id));

    for (const person of kept) {
      await tx
        .update(contacts)
        .set({
          name: person.name,
          phone: person.phone,
          note: person.note,
          updatedAt: new Date(),
        })
        .where(and(eq(contacts.id, person.id), eq(contacts.userId, userId)));
    }
    if (added.length > 0) {
      await tx.insert(contacts).values(
        added.map((person) => ({
          userId,
          metDate: reportDate,
          name: person.name,
          phone: person.phone,
          note: person.note,
        })),
      );
    }
    if (removedIds.length > 0) {
      await tx
        .delete(contacts)
        .where(and(eq(contacts.userId, userId), inArray(contacts.id, removedIds)));
    }
  });
}

/** Removes one of the member's own entries. */
export async function deleteOwnContact(userId: string, contactId: number) {
  await db
    .delete(contacts)
    .where(and(eq(contacts.id, contactId), eq(contacts.userId, userId)));
}

// ─── Follow-up ─────────────────────────────────────────────────────────────

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

/**
 * Marks a person followed up, or puts them back on the to-do list. Marking
 * someone who is already followed up keeps who did it and when, so a note can
 * be added or corrected afterwards; leaving `note` out leaves the note alone.
 */
export async function setContactFollowUp(
  contactId: number,
  followUp: { by: string; note?: string | null } | null,
) {
  await db
    .update(contacts)
    .set(
      followUp
        ? {
            followedUpAt: sql`coalesce(${contacts.followedUpAt}, now())`,
            followedUpBy: sql`coalesce(${contacts.followedUpBy}, ${followUp.by})`,
            ...(followUp.note === undefined ? {} : { followUpNote: followUp.note }),
            updatedAt: new Date(),
          }
        : {
            followedUpAt: null,
            followedUpBy: null,
            followUpNote: null,
            updatedAt: new Date(),
          },
    )
    .where(eq(contacts.id, contactId));
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
  const inUnit =
    unitId != null
      ? inArray(
          contacts.userId,
          db
            .select({ userId: schema.sogpEnrollments.userId })
            .from(schema.sogpEnrollments)
            .innerJoin(
              schema.unitMembers,
              eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
            )
            .where(eq(schema.unitMembers.unitId, unitId)),
        )
      : undefined;

  const rows = await db
    .select({ ...contactColumns, memberName: schema.users.name })
    .from(contacts)
    .innerJoin(schema.users, eq(schema.users.id, contacts.userId))
    .leftJoin(followUpUser, eq(followUpUser.id, contacts.followedUpBy))
    .where(
      and(
        gte(contacts.metDate, fromKey),
        lte(contacts.metDate, toKey),
        inUnit,
        memberUserId ? eq(contacts.userId, memberUserId) : undefined,
        pendingOnly ? isNull(contacts.followedUpAt) : undefined,
      ),
    )
    .orderBy(desc(contacts.metDate), desc(contacts.id))
    .limit(limit);

  return rows.map((row) => ({ ...toContact(row), memberName: row.memberName }));
}
