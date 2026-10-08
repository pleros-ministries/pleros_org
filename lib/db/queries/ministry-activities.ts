import { and, asc, desc, eq, gte, inArray, lt, lte, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { transactionDb } from "@/lib/db/transaction";
import { CommunityError } from "@/lib/community/errors";
import {
  ACTIVITIES_PER_DAY_MAX,
  ACTIVITY_KINDS,
  activityKindConfig,
  type ActivityInput,
  type ActivityKind,
  type OutreachMode,
} from "@/lib/community/ministry-activities";
import {
  MINISTRY_FIELDS,
  NO_DAY_ACTIVITY,
  sumMinistryNumbers,
  type DayActivity,
  type MinistryFieldKey,
  type MinistryNumbers,
} from "@/lib/community/ministry-report";
import type {
  ContactOutcomes,
  ContactRow,
  FollowUpRow,
  InteractionKind,
} from "@/lib/community/outreach-contacts";
import { getSogpDailyParticipation, getSogpParticipationRange } from "@/lib/db/queries/sogp-daily";
import {
  lagosDayRange,
  lagosRange,
  toLagosDateKey,
} from "@/lib/sogp/daily-participation";

import { inUnit } from "./community-scope";
import { activityMemberUnitName, activityPeopleCount } from "./ministry-sql";
import {
  listContactsForActivity,
  markContactsSaved,
  removeContacts,
  syncContactFollowUp,
  type ActivityPerson,
  type Tx,
} from "./outreach-contacts";

/**
 * The ministry activity log: what each member did on each Lagos day, as they
 * entered it, plus the Pleros activity compiled beside it. Pleros activity is
 * always read live from its own tables (Bible reading, Prayer Watch, podcast,
 * SOGP); only the activities themselves are stored.
 */

const activities = schema.ministryActivities;
const contacts = schema.outreachContacts;
const interactions = schema.outreachContactInteractions;

/** Checked against the field list at compile time, so a new field cannot be forgotten here. */
const numberColumns = {
  reachedOnline: activities.reachedOnline,
  reachedOffline: activities.reachedOffline,
  attendance: activities.attendance,
  saved: activities.saved,
  notSaved: activities.notSaved,
  filled: activities.filled,
  healed: activities.healed,
  followUps: activities.followUps,
} satisfies Record<MinistryFieldKey, unknown>;

const sumColumns = Object.fromEntries(
  MINISTRY_FIELDS.map((field) => [
    field.key,
    sql<number>`coalesce(sum(${numberColumns[field.key]}), 0)::int`,
  ]),
) as Record<MinistryFieldKey, SQL<number>>;

const kindCountColumns = Object.fromEntries(
  ACTIVITY_KINDS.map((kind) => [
    kind.key,
    sql<number>`count(*) filter (where ${activities.kind} = ${kind.key})::int`,
  ]),
) as Record<ActivityKind, SQL<number>>;

const activityColumns = {
  id: activities.id,
  activityDate: activities.activityDate,
  kind: activities.kind,
  title: activities.title,
  mode: activities.mode,
  platform: activities.platform,
  location: activities.location,
  note: activities.note,
  ...numberColumns,
  peopleCount: activityPeopleCount,
};

export type MemberActivity = MinistryNumbers & {
  id: number;
  activityDate: string;
  kind: ActivityKind;
  title: string | null;
  mode: OutreachMode | null;
  platform: string | null;
  location: string | null;
  note: string | null;
  peopleCount: number;
};

/** Splits the per-kind counts out of a grouped row into `byKind`. */
function splitKinds<T extends Record<ActivityKind, number>>(
  row: T,
): Omit<T, ActivityKind> & { byKind: Record<ActivityKind, number> } {
  const rest: Record<string, unknown> = { ...row };
  const byKind = {} as Record<ActivityKind, number>;
  for (const kind of ACTIVITY_KINDS) {
    byKind[kind.key] = row[kind.key];
    delete rest[kind.key];
  }
  return { ...(rest as unknown as Omit<T, ActivityKind>), byKind };
}

// ─── A member's own activities ─────────────────────────────────────────────

/** One person's activities between two Lagos date keys (inclusive), newest day first. */
export async function listActivitiesForUser(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<MemberActivity[]> {
  return db
    .select(activityColumns)
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        gte(activities.activityDate, fromKey),
        lte(activities.activityDate, toKey),
      ),
    )
    .orderBy(desc(activities.activityDate), asc(activities.id));
}

/** One person's activities for one day, in the order they were added. */
export async function listActivitiesForDay(
  userId: string,
  dateKey: string,
): Promise<MemberActivity[]> {
  return db
    .select(activityColumns)
    .from(activities)
    .where(and(eq(activities.userId, userId), eq(activities.activityDate, dateKey)))
    .orderBy(asc(activities.id));
}

export async function hasActivityFor(userId: string, dateKey: string): Promise<boolean> {
  const [row] = await db
    .select({ id: activities.id })
    .from(activities)
    .where(and(eq(activities.userId, userId), eq(activities.activityDate, dateKey)))
    .limit(1);
  return Boolean(row);
}

/** The day one of the member's own activities belongs to, or null when it is not theirs. */
export async function getOwnActivityDate(
  userId: string,
  activityId: number,
): Promise<string | null> {
  const [row] = await db
    .select({ activityDate: activities.activityDate })
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.userId, userId)))
    .limit(1);
  return row?.activityDate ?? null;
}

/** An existing person followed up in a follow-up activity. */
export type ActivityFollowUp = {
  interactionId: number;
  contactId: number;
  name: string;
  phone: string | null;
  kind: InteractionKind;
  outcomes: ContactOutcomes;
  note: string | null;
};

export type ActivityForEdit = MemberActivity & {
  /** People met at an outreach. */
  people: ActivityPerson[];
  /** People followed up in a follow-up. Named apart from the `followUps` count. */
  followUpPeople: ActivityFollowUp[];
};

/** What the edit form needs, owner-scoped. */
export async function getActivityForEdit(
  userId: string,
  activityId: number,
): Promise<ActivityForEdit | null> {
  const [activity] = await db
    .select(activityColumns)
    .from(activities)
    .where(and(eq(activities.id, activityId), eq(activities.userId, userId)))
    .limit(1);
  if (!activity) return null;

  const config = activityKindConfig(activity.kind);
  const [people, followUpPeople] = await Promise.all([
    config.people === "met"
      ? listContactsForActivity(userId, activityId)
      : Promise.resolve([]),
    config.people === "follow_up"
      ? db
          .select({
            interactionId: interactions.id,
            contactId: interactions.contactId,
            name: contacts.name,
            phone: contacts.phone,
            kind: interactions.kind,
            saved: interactions.saved,
            filled: interactions.filled,
            healed: interactions.healed,
            note: interactions.note,
          })
          .from(interactions)
          .innerJoin(contacts, eq(contacts.id, interactions.contactId))
          .where(eq(interactions.activityId, activityId))
          .orderBy(asc(interactions.id))
          .then((rows) =>
            rows.map(({ saved, filled, healed, ...row }) => ({
              ...row,
              outcomes: { saved, filled, healed },
            })),
          )
      : Promise.resolve([]),
  ]);

  return { ...activity, people, followUpPeople };
}

// ─── Saving and removing ───────────────────────────────────────────────────

/**
 * Keeps the people met at an outreach in step with the rows now in the form:
 * rows with a known id are corrected in place (their statuses and history
 * are left alone), rows without one are added with a `met` entry, and saved
 * people no longer in the list are removed.
 */
async function reconcilePeopleMet(
  tx: Tx,
  input: { userId: string; activityId: number; dateKey: string; people: ContactRow[] },
) {
  const { userId, activityId, dateKey, people } = input;
  const saved = await tx
    .select({ id: contacts.id })
    .from(contacts)
    .where(and(eq(contacts.userId, userId), eq(contacts.activityId, activityId)));
  const savedIds = new Set(saved.map((row) => row.id));

  // An id that is not one of this member's rows for this activity is treated as new.
  const kept = people.filter(
    (person): person is ContactRow & { id: number } =>
      person.id != null && savedIds.has(person.id),
  );
  const added = people.filter((person) => person.id == null || !savedIds.has(person.id));
  const keptIds = new Set(kept.map((person) => person.id));
  const removedIds = [...savedIds].filter((id) => !keptIds.has(id));
  const nowSaved: number[] = [];
  const wantFollowUp: number[] = [];

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
    const updated = await tx
      .update(interactions)
      .set({ ...person.outcomes })
      .where(
        and(
          eq(interactions.activityId, activityId),
          eq(interactions.contactId, person.id),
          eq(interactions.kind, "met"),
        ),
      )
      .returning({ id: interactions.id });
    if (updated.length === 0) {
      await tx.insert(interactions).values({
        contactId: person.id,
        userId,
        activityId,
        interactionDate: dateKey,
        kind: "met",
        ...person.outcomes,
      });
    }
    if (person.outcomes.saved) nowSaved.push(person.id);
    if (person.wantsFollowUp) wantFollowUp.push(person.id);
  }

  for (const person of added) {
    const [row] = await tx
      .insert(contacts)
      .values({
        userId,
        metDate: dateKey,
        activityId,
        name: person.name,
        phone: person.phone,
        note: person.note,
      })
      .returning({ id: contacts.id });
    await tx.insert(interactions).values({
      contactId: row.id,
      userId,
      activityId,
      interactionDate: dateKey,
      kind: "met",
      ...person.outcomes,
    });
    if (person.outcomes.saved) nowSaved.push(row.id);
    if (person.wantsFollowUp) wantFollowUp.push(row.id);
  }

  await removeContacts(tx, userId, removedIds);
  await markContactsSaved(tx, nowSaved);
  if (wantFollowUp.length > 0) {
    // Starts their discipleship status; a status set later in the people area is left alone.
    await tx
      .update(contacts)
      .set({ discipleshipStatus: "following_up", updatedAt: new Date() })
      .where(
        and(
          inArray(contacts.id, wantFollowUp),
          eq(contacts.discipleshipStatus, "not_started"),
        ),
      );
  }
}

/**
 * Keeps the follow-up entries of a follow-up activity in step with the rows
 * now in the form: one interaction per person, added, corrected or removed.
 */
async function reconcileFollowUps(
  tx: Tx,
  input: { userId: string; activityId: number; dateKey: string; followUps: FollowUpRow[] },
) {
  const { userId, activityId, dateKey, followUps } = input;
  const contactIds = followUps.map((row) => row.contactId);
  if (contactIds.length > 0) {
    const owned = await tx
      .select({ id: contacts.id })
      .from(contacts)
      .where(and(eq(contacts.userId, userId), inArray(contacts.id, contactIds)));
    if (owned.length !== contactIds.length) {
      throw new CommunityError("One of those people is not on your list.");
    }
  }

  const existing = await tx
    .select({ id: interactions.id, contactId: interactions.contactId })
    .from(interactions)
    .where(eq(interactions.activityId, activityId));
  const byContact = new Map(existing.map((row) => [row.contactId, row.id]));

  for (const row of followUps) {
    const current = byContact.get(row.contactId);
    if (current != null) {
      await tx
        .update(interactions)
        .set({
          kind: row.kind,
          interactionDate: dateKey,
          ...row.outcomes,
          note: row.note,
        })
        .where(eq(interactions.id, current));
      byContact.delete(row.contactId);
    } else {
      await tx.insert(interactions).values({
        contactId: row.contactId,
        userId,
        activityId,
        interactionDate: dateKey,
        kind: row.kind,
        ...row.outcomes,
        note: row.note,
      });
    }
  }
  const removed = [...byContact.values()];
  if (removed.length > 0) {
    await tx.delete(interactions).where(inArray(interactions.id, removed));
  }

  await syncContactFollowUp(tx, [...contactIds, ...byContact.keys()]);
  await markContactsSaved(
    tx,
    followUps.filter((row) => row.outcomes.saved).map((row) => row.contactId),
  );
}

/**
 * Adds or corrects one activity together with its people, in one
 * transaction. The day and kind of an existing activity never change; the
 * member removes it and adds it again instead.
 */
export async function saveActivity(input: {
  userId: string;
  activityId: number | null;
  dateKey: string;
  activity: ActivityInput;
  people: ContactRow[];
  followUps: FollowUpRow[];
}): Promise<{ activityId: number }> {
  const { userId, dateKey, activity } = input;
  const config = activityKindConfig(activity.kind);

  return transactionDb.transaction(async (tx) => {
    let activityId: number;

    if (input.activityId != null) {
      const [existing] = await tx
        .select({
          id: activities.id,
          activityDate: activities.activityDate,
          kind: activities.kind,
        })
        .from(activities)
        .where(and(eq(activities.id, input.activityId), eq(activities.userId, userId)))
        .for("update");
      if (!existing) throw new CommunityError("That activity is no longer there.");
      if (existing.activityDate !== dateKey || existing.kind !== activity.kind) {
        throw new CommunityError(
          "The day and kind of an activity cannot change. Remove it and add it again.",
        );
      }
      await tx
        .update(activities)
        .set({ ...activity, updatedAt: new Date() })
        .where(eq(activities.id, existing.id));
      activityId = existing.id;
    } else {
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(activities)
        .where(and(eq(activities.userId, userId), eq(activities.activityDate, dateKey)));
      if (count >= ACTIVITIES_PER_DAY_MAX) {
        throw new CommunityError(
          `You can log up to ${ACTIVITIES_PER_DAY_MAX} activities for one day.`,
        );
      }
      const [row] = await tx
        .insert(activities)
        .values({ userId, activityDate: dateKey, ...activity })
        .returning({ id: activities.id });
      activityId = row.id;
    }

    if (config.people === "met") {
      await reconcilePeopleMet(tx, { userId, activityId, dateKey, people: input.people });
    }
    if (config.people === "follow_up") {
      await reconcileFollowUps(tx, {
        userId,
        activityId,
        dateKey,
        followUps: input.followUps,
      });
    }
    return { activityId };
  });
}

/**
 * Removes one of the member's own activities. People met or followed up in
 * it stay, with their history; they simply lose the link to the activity.
 */
export async function deleteActivity(
  userId: string,
  activityId: number,
): Promise<{ activityDate: string } | null> {
  return transactionDb.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: activities.id, activityDate: activities.activityDate })
      .from(activities)
      .where(and(eq(activities.id, activityId), eq(activities.userId, userId)))
      .for("update");
    if (!existing) return null;

    await tx
      .update(interactions)
      .set({ activityId: null })
      .where(eq(interactions.activityId, existing.id));
    await tx
      .update(contacts)
      .set({ activityId: null, updatedAt: new Date() })
      .where(eq(contacts.activityId, existing.id));
    await tx.delete(activities).where(eq(activities.id, existing.id));
    return { activityDate: existing.activityDate };
  });
}

// ─── Pleros activity for one day ───────────────────────────────────────────

type ActivityMember = {
  userId: string;
  /** The enrolment whose SOGP activity counts; null when not in a cohort. */
  enrollmentId: number | null;
  cohortId: number | null;
};

/** Narrow each lookup to the people asked for when there are few of them. */
const NARROW_LIMIT = 50;

/**
 * Compiles what the app recorded for each member on `dateKey`. A fixed number
 * of queries however many members are passed (one extra per cohort for SOGP).
 */
async function loadDayActivity(
  members: ActivityMember[],
  dateKey: string,
): Promise<Map<string, DayActivity>> {
  const result = new Map<string, DayActivity>();
  if (members.length === 0) return result;

  const narrow = members.length <= NARROW_LIMIT;
  const userIds = members.map((member) => member.userId);
  const enrolled = members.filter(
    (member): member is ActivityMember & { enrollmentId: number; cohortId: number } =>
      member.enrollmentId != null && member.cohortId != null,
  );
  const enrollmentIds = enrolled.map((member) => member.enrollmentId);
  const cohortIds = [...new Set(enrolled.map((member) => member.cohortId))];
  const { start, end } = lagosDayRange(dateKey);

  const [bibleRows, prayerRows, podcastRows, prepRows, sogpRows] = await Promise.all([
    db
      .select({
        userId: schema.bibleReadingLogs.userId,
        chapters: schema.bibleReadingLogs.chaptersRead,
        book: schema.bibleReadingLogs.currentBook,
        chapter: schema.bibleReadingLogs.currentChapter,
      })
      .from(schema.bibleReadingLogs)
      .where(
        and(
          eq(schema.bibleReadingLogs.readingDate, dateKey),
          narrow ? inArray(schema.bibleReadingLogs.userId, userIds) : undefined,
        ),
      ),
    db
      .select({
        userId: schema.prayerWatchAttendance.userId,
        session: schema.prayerWatchAttendance.session,
      })
      .from(schema.prayerWatchAttendance)
      .where(
        and(
          eq(schema.prayerWatchAttendance.attendedDate, dateKey),
          narrow
            ? inArray(schema.prayerWatchAttendance.userId, userIds)
            : undefined,
        ),
      ),
    db
      .select({
        userId: schema.podcastEpisodeProgress.userId,
        episodes: sql<number>`count(*)::int`,
      })
      .from(schema.podcastEpisodeProgress)
      .where(
        and(
          gte(schema.podcastEpisodeProgress.listenedAt, start),
          lt(schema.podcastEpisodeProgress.listenedAt, end),
          narrow
            ? inArray(schema.podcastEpisodeProgress.userId, userIds)
            : undefined,
        ),
      )
      .groupBy(schema.podcastEpisodeProgress.userId),
    enrollmentIds.length > 0
      ? db
          .select({
            enrollmentId: schema.sogpPreparationCompletions.enrollmentId,
          })
          .from(schema.sogpPreparationCompletions)
          .where(
            and(
              gte(schema.sogpPreparationCompletions.completedAt, start),
              lt(schema.sogpPreparationCompletions.completedAt, end),
              narrow
                ? inArray(
                    schema.sogpPreparationCompletions.enrollmentId,
                    enrollmentIds,
                  )
                : undefined,
            ),
          )
      : Promise.resolve([]),
    Promise.all(
      cohortIds.map((cohortId) =>
        getSogpDailyParticipation(
          cohortId,
          dateKey,
          undefined,
          narrow
            ? enrolled
                .filter((member) => member.cohortId === cohortId)
                .map((member) => member.enrollmentId)
            : undefined,
        ),
      ),
    ),
  ]);

  const bibleByUser = new Map(bibleRows.map((row) => [row.userId, row]));
  const prayerByUser = new Map<string, DayActivity["prayerWatch"]>();
  for (const row of prayerRows) {
    prayerByUser.set(row.userId, [
      ...(prayerByUser.get(row.userId) ?? []),
      row.session,
    ]);
  }
  const podcastByUser = new Map(podcastRows.map((row) => [row.userId, row.episodes]));
  const prepDone = new Set(prepRows.map((row) => row.enrollmentId));
  const sogpByEnrollment = new Map(
    sogpRows.flat().map((row) => [row.enrollmentId, row]),
  );

  for (const member of members) {
    const bible = bibleByUser.get(member.userId);
    const sogp =
      member.enrollmentId != null
        ? sogpByEnrollment.get(member.enrollmentId)
        : undefined;
    result.set(member.userId, {
      bible: bible
        ? { chapters: bible.chapters, book: bible.book, chapter: bible.chapter }
        : null,
      prayerWatch: prayerByUser.get(member.userId) ?? [],
      podcastEpisodes: podcastByUser.get(member.userId) ?? 0,
      sogp:
        member.enrollmentId != null
          ? {
              listened: sogp?.listened ?? null,
              quizAttempted: sogp?.quizAttempted ?? false,
              writtenSubmitted: sogp?.writtenSubmitted ?? false,
              reviewAttended: sogp?.reviewAttended ?? false,
              preparationDone: prepDone.has(member.enrollmentId),
            }
          : null,
    });
  }
  return result;
}

/** The newest enrolment a person holds, which is the cohort they are working through. */
async function findActivityMember(userId: string): Promise<ActivityMember> {
  const [enrollment] = await db
    .select({
      enrollmentId: schema.sogpEnrollments.id,
      cohortId: schema.sogpEnrollments.cohortId,
    })
    .from(schema.sogpEnrollments)
    .where(eq(schema.sogpEnrollments.userId, userId))
    .orderBy(desc(schema.sogpEnrollments.createdAt))
    .limit(1);
  return {
    userId,
    enrollmentId: enrollment?.enrollmentId ?? null,
    cohortId: enrollment?.cohortId ?? null,
  };
}

/** One member's Pleros activity on one day. */
export async function getDayActivity(
  userId: string,
  dateKey: string,
): Promise<DayActivity> {
  const member = await findActivityMember(userId);
  const activity = await loadDayActivity([member], dateKey);
  return activity.get(userId) ?? NO_DAY_ACTIVITY;
}

// ─── Activity across a run of days (history tables) ────────────────────────

/** A lighter view of a day, for tables that span many days. */
export type DayActivitySummary = {
  bible: boolean;
  prayerWatch: boolean;
  podcastEpisodes: number;
  /** null when the member is not in a cohort. */
  sogp: boolean | null;
};

/** One member's activity for each day between two Lagos date keys, keyed by date. */
export async function getActivityRange(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<Map<string, DayActivitySummary>> {
  const member = await findActivityMember(userId);
  const { start, end } = lagosRange(fromKey, toKey);

  const [bibleRows, prayerRows, podcastRows, sogpRows] = await Promise.all([
    db
      .select({ dateKey: schema.bibleReadingLogs.readingDate })
      .from(schema.bibleReadingLogs)
      .where(
        and(
          eq(schema.bibleReadingLogs.userId, userId),
          gte(schema.bibleReadingLogs.readingDate, fromKey),
          lte(schema.bibleReadingLogs.readingDate, toKey),
        ),
      ),
    db
      .select({ dateKey: schema.prayerWatchAttendance.attendedDate })
      .from(schema.prayerWatchAttendance)
      .where(
        and(
          eq(schema.prayerWatchAttendance.userId, userId),
          gte(schema.prayerWatchAttendance.attendedDate, fromKey),
          lte(schema.prayerWatchAttendance.attendedDate, toKey),
        ),
      ),
    db
      .select({ listenedAt: schema.podcastEpisodeProgress.listenedAt })
      .from(schema.podcastEpisodeProgress)
      .where(
        and(
          eq(schema.podcastEpisodeProgress.userId, userId),
          gte(schema.podcastEpisodeProgress.listenedAt, start),
          lt(schema.podcastEpisodeProgress.listenedAt, end),
        ),
      ),
    member.enrollmentId != null && member.cohortId != null
      ? getSogpParticipationRange(member.cohortId, fromKey, toKey, {
          enrollmentIds: [member.enrollmentId],
        })
      : Promise.resolve([]),
  ]);

  const days = new Map<string, DayActivitySummary>();
  const day = (dateKey: string) => {
    let entry = days.get(dateKey);
    if (!entry) {
      entry = {
        bible: false,
        prayerWatch: false,
        podcastEpisodes: 0,
        sogp: member.enrollmentId != null ? false : null,
      };
      days.set(dateKey, entry);
    }
    return entry;
  };

  for (const row of bibleRows) day(row.dateKey).bible = true;
  for (const row of prayerRows) day(row.dateKey).prayerWatch = true;
  for (const row of podcastRows) {
    day(toLagosDateKey(row.listenedAt)).podcastEpisodes += 1;
  }
  for (const row of sogpRows) {
    if (row.listened === true || row.reviewAttended === true) {
      day(row.dateKey).sogp = true;
    }
  }
  return days;
}

// ─── Staff views ───────────────────────────────────────────────────────────

export type StaffMinistryRow = {
  userId: string;
  name: string;
  unitName: string | null;
  /** What they logged that day; empty when nothing. */
  activities: MemberActivity[];
  /** The day's numbers added up; null when nothing was logged. */
  totals: MinistryNumbers | null;
  activity: DayActivity;
};

/**
 * Everyone's ministry day: each community member (optionally one location
 * group) with their activities, if any, and their Pleros activity. Carries
 * full names and notes, so it is for admins and the group's assigned pastor only.
 */
export async function getMinistryDay({
  dateKey,
  unitId,
}: {
  dateKey: string;
  unitId?: number | null;
}): Promise<StaffMinistryRow[]> {
  const [enrolmentRows, activityRows] = await Promise.all([
    db
      .select({
        userId: schema.sogpEnrollments.userId,
        name: schema.sogpEnrollments.name,
        enrollmentId: schema.sogpEnrollments.id,
        cohortId: schema.sogpEnrollments.cohortId,
        unitName: schema.units.name,
      })
      .from(schema.sogpEnrollments)
      .leftJoin(
        schema.unitMembers,
        eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
      )
      .leftJoin(schema.units, eq(schema.units.id, schema.unitMembers.unitId))
      .where(unitId != null ? eq(schema.unitMembers.unitId, unitId) : undefined)
      // Newest enrolment first, so it is the one kept for each person below.
      .orderBy(desc(schema.sogpEnrollments.createdAt)),
    db
      .select({
        userId: activities.userId,
        userName: schema.users.name,
        ...activityColumns,
      })
      .from(activities)
      .innerJoin(schema.users, eq(schema.users.id, activities.userId))
      .where(eq(activities.activityDate, dateKey))
      .orderBy(asc(activities.id)),
  ]);

  type Member = ActivityMember & { name: string; unitName: string | null };
  const members = new Map<string, Member>();
  for (const row of enrolmentRows) {
    if (!members.has(row.userId)) members.set(row.userId, row);
  }
  // Admins and pastors may report without an enrolment; show them when no group is selected.
  if (unitId == null) {
    for (const row of activityRows) {
      if (!members.has(row.userId)) {
        members.set(row.userId, {
          userId: row.userId,
          name: row.userName,
          unitName: null,
          enrollmentId: null,
          cohortId: null,
        });
      }
    }
  }

  const memberList = [...members.values()];
  const pleros = await loadDayActivity(memberList, dateKey);
  const byUser = new Map<string, MemberActivity[]>();
  for (const entry of activityRows) {
    const { userId, ...rest } = entry;
    const { userName, ...row } = rest;
    void userName;
    const list = byUser.get(userId);
    if (list) list.push(row);
    else byUser.set(userId, [row]);
  }

  return memberList
    .map((member) => {
      const list = byUser.get(member.userId) ?? [];
      return {
        userId: member.userId,
        name: member.name,
        unitName: member.unitName,
        activities: list,
        totals: list.length > 0 ? sumMinistryNumbers(list) : null,
        activity: pleros.get(member.userId) ?? NO_DAY_ACTIVITY,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type MinistryDayTotals = MinistryNumbers & {
  dateKey: string;
  /** Members who logged at least one activity that day. */
  members: number;
  activities: number;
  byKind: Record<ActivityKind, number>;
};

/** Activities logged and their totals for each day in a range, newest first. */
export async function getMinistryTotalsByDay(
  fromKey: string,
  toKey: string,
  { unitId }: { unitId?: number | null } = {},
): Promise<MinistryDayTotals[]> {
  const rows = await db
    .select({
      dateKey: activities.activityDate,
      members: sql<number>`count(distinct ${activities.userId})::int`,
      activities: sql<number>`count(*)::int`,
      ...sumColumns,
      ...kindCountColumns,
    })
    .from(activities)
    .where(
      and(
        gte(activities.activityDate, fromKey),
        lte(activities.activityDate, toKey),
        inUnit(activities.userId, unitId),
      ),
    )
    .groupBy(activities.activityDate)
    .orderBy(desc(activities.activityDate));
  return rows.map(splitKinds);
}

export type MinistryMemberTotals = MinistryNumbers & {
  userId: string;
  name: string;
  unitName: string | null;
  /** Days in the range on which this member logged something. */
  days: number;
  activities: number;
  byKind: Record<ActivityKind, number>;
};

/** Each member's totals between two Lagos date keys — the sortable range table. */
export async function getMinistryTotalsByMember(
  fromKey: string,
  toKey: string,
  { unitId }: { unitId?: number | null } = {},
): Promise<MinistryMemberTotals[]> {
  const rows = await db
    .select({
      userId: activities.userId,
      name: schema.users.name,
      unitName: activityMemberUnitName,
      days: sql<number>`count(distinct ${activities.activityDate})::int`,
      activities: sql<number>`count(*)::int`,
      ...sumColumns,
      ...kindCountColumns,
    })
    .from(activities)
    .innerJoin(schema.users, eq(schema.users.id, activities.userId))
    .where(
      and(
        gte(activities.activityDate, fromKey),
        lte(activities.activityDate, toKey),
        inUnit(activities.userId, unitId),
      ),
    )
    .groupBy(activities.userId, schema.users.name);
  return rows.map(splitKinds);
}

export type MemberMinistryHistory = {
  name: string;
  unitName: string | null;
  activities: MemberActivity[];
  activity: Map<string, DayActivitySummary>;
};

/** One person's activities and Pleros activity over a range — the admin drill-down. */
export async function getMemberMinistryHistory(
  userId: string,
  fromKey: string,
  toKey: string,
): Promise<MemberMinistryHistory | null> {
  const [[person], [group], memberActivities, activity] = await Promise.all([
    db
      .select({ name: schema.users.name })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1),
    db
      .select({ unitName: schema.units.name })
      .from(schema.sogpEnrollments)
      .innerJoin(
        schema.unitMembers,
        eq(schema.unitMembers.enrollmentId, schema.sogpEnrollments.id),
      )
      .innerJoin(schema.units, eq(schema.units.id, schema.unitMembers.unitId))
      .where(eq(schema.sogpEnrollments.userId, userId))
      .orderBy(asc(schema.sogpEnrollments.createdAt))
      .limit(1),
    listActivitiesForUser(userId, fromKey, toKey),
    getActivityRange(userId, fromKey, toKey),
  ]);
  if (!person) return null;

  return {
    name: person.name,
    unitName: group?.unitName ?? null,
    activities: memberActivities,
    activity,
  };
}

export type StaffActivity = MemberActivity & {
  userId: string;
  memberName: string;
  unitName: string | null;
};

/** Every activity in a range with who logged it, for the admin export. */
export async function listActivitiesForStaff({
  fromKey,
  toKey,
  unitId,
  memberUserId,
  limit = 5000,
}: {
  fromKey: string;
  toKey: string;
  unitId?: number | null;
  memberUserId?: string | null;
  limit?: number;
}): Promise<StaffActivity[]> {
  return db
    .select({
      ...activityColumns,
      userId: activities.userId,
      memberName: schema.users.name,
      unitName: activityMemberUnitName,
    })
    .from(activities)
    .innerJoin(schema.users, eq(schema.users.id, activities.userId))
    .where(
      and(
        gte(activities.activityDate, fromKey),
        lte(activities.activityDate, toKey),
        inUnit(activities.userId, unitId),
        memberUserId ? eq(activities.userId, memberUserId) : undefined,
      ),
    )
    .orderBy(asc(activities.activityDate), asc(schema.users.name), asc(activities.id))
    .limit(limit);
}

// ─── A discipler's view of their disciples ─────────────────────────────────

/** Numbers only, added up over the day: a discipler never receives a note, place or person. */
export type DiscipleMinistryDay = {
  membershipId: number;
  reachedOnline: number;
  reachedOffline: number;
  attendance: number;
  saved: number;
};

/**
 * What one group's active disciples logged for `dateKey`. The group is matched
 * against the leader's own enrolment, so a learner can only ever read a group
 * they lead. Disciples who logged nothing that day are simply absent.
 */
export async function getDisciplesMinistryDay(
  leaderEnrollmentId: number,
  groupId: number,
  dateKey: string,
): Promise<DiscipleMinistryDay[]> {
  return db
    .select({
      membershipId: schema.discipleshipMemberships.id,
      reachedOnline: sumColumns.reachedOnline,
      reachedOffline: sumColumns.reachedOffline,
      attendance: sumColumns.attendance,
      saved: sumColumns.saved,
    })
    .from(schema.discipleshipGroups)
    .innerJoin(
      schema.discipleshipMemberships,
      and(
        eq(schema.discipleshipMemberships.groupId, schema.discipleshipGroups.id),
        eq(schema.discipleshipMemberships.status, "active"),
      ),
    )
    .innerJoin(
      schema.sogpEnrollments,
      eq(
        schema.sogpEnrollments.id,
        schema.discipleshipMemberships.discipleEnrollmentId,
      ),
    )
    .innerJoin(
      activities,
      and(
        eq(activities.userId, schema.sogpEnrollments.userId),
        eq(activities.activityDate, dateKey),
      ),
    )
    .where(
      and(
        eq(schema.discipleshipGroups.id, groupId),
        eq(schema.discipleshipGroups.leaderEnrollmentId, leaderEnrollmentId),
      ),
    )
    .groupBy(schema.discipleshipMemberships.id);
}
