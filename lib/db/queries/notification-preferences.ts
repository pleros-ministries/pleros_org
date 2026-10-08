import { and, eq, gte, inArray, notInArray, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  WEEKLY_GRACE_MS,
  chooseReminderCohort,
  type ReminderCohort,
} from "@/lib/notifications/reminder-plan";
import {
  resolveReminderPreferences,
  type ReminderChoices,
  type ReminderPreferenceRow,
  type ReminderPreferences,
} from "@/lib/notifications/reminder-preferences";
import { toLagosDateKey } from "@/lib/sogp/formation-progress";

import * as schema from "../schema";

const preferences = schema.learnerNotificationPreferences;

// ─── Reading and saving one learner's preferences ───────────────────────────

export async function getReminderPreferences(
  userId: string,
): Promise<ReminderPreferences> {
  const [row] = await db
    .select()
    .from(preferences)
    .where(eq(preferences.userId, userId))
    .limit(1);
  return resolveReminderPreferences(row);
}

/**
 * Saves the daily teaching time. The first time a learner chooses a time the
 * teaching reminder is switched on with it; later changes leave their choice.
 */
export async function saveTeachingTime(input: {
  userId: string;
  timeZone: string;
  teachingTimeMinutes: number;
}) {
  await db
    .insert(preferences)
    .values({
      userId: input.userId,
      timeZone: input.timeZone,
      teachingTimeMinutes: input.teachingTimeMinutes,
      teachingReminderEnabled: true,
    })
    .onConflictDoUpdate({
      target: preferences.userId,
      set: {
        timeZone: input.timeZone,
        teachingTimeMinutes: input.teachingTimeMinutes,
        teachingReminderEnabled: sql`CASE WHEN ${preferences.teachingTimeMinutes} IS NULL THEN true ELSE ${preferences.teachingReminderEnabled} END`,
        updatedAt: new Date(),
      },
    });
}

/**
 * Saves the reminders step. A teaching reminder cannot be on without a time,
 * whatever the form sent.
 */
export async function saveReminderPreferences(input: {
  userId: string;
  timeZone: string;
  choices: ReminderChoices;
}) {
  const { choices } = input;
  const now = new Date();
  const shared = {
    timeZone: input.timeZone,
    prayerWatchMorning: choices.prayerWatch.morning,
    prayerWatchAfternoon: choices.prayerWatch.afternoon,
    prayerWatchEvening: choices.prayerWatch.evening,
    communityEnabled: choices.communityEnabled,
    progressNudgesEnabled: choices.progressNudgesEnabled,
    newContentEnabled: choices.newContentEnabled,
    weeklySummaryEnabled: choices.weeklySummaryEnabled,
    remindersSavedAt: now,
  };

  await db
    .insert(preferences)
    .values({
      userId: input.userId,
      ...shared,
      // A brand-new row has no teaching time yet.
      teachingReminderEnabled: false,
    })
    .onConflictDoUpdate({
      target: preferences.userId,
      set: {
        ...shared,
        teachingReminderEnabled: choices.teachingReminderEnabled
          ? sql`${preferences.teachingTimeMinutes} IS NOT NULL`
          : false,
        updatedAt: now,
      },
    });
}

/** Records that the learner has Pleros installed on some device. */
export async function markAppInstalled(userId: string) {
  const now = new Date();
  await db
    .insert(preferences)
    .values({ userId, appInstalledAt: now })
    .onConflictDoUpdate({
      target: preferences.userId,
      set: {
        // Keep the first time it was recorded.
        appInstalledAt: sql`COALESCE(${preferences.appInstalledAt}, now())`,
        updatedAt: now,
      },
    });
}

// ─── Push subscriptions ─────────────────────────────────────────────────────

export async function hasPushSubscription(userId: string) {
  const [row] = await db
    .select({ id: schema.pushSubscriptions.id })
    .from(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.userId, userId))
    .limit(1);
  return Boolean(row);
}

/**
 * Binds a browser's push subscription to the signed-in learner.
 *
 * The endpoint is the identity of the device, so an existing row is re-bound
 * to this learner with fresh keys (a shared phone follows whoever turned
 * notifications on last). The same endpoint is removed from the anonymous
 * table: a device is learner-bound or anonymous, never both, so it is never
 * pushed twice. Binding never touches the learner's preferences.
 */
export async function bindPushSubscription(input: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  await db
    .insert(schema.pushSubscriptions)
    .values(input)
    .onConflictDoUpdate({
      target: schema.pushSubscriptions.endpoint,
      set: { userId: input.userId, p256dh: input.p256dh, auth: input.auth },
    });

  await db
    .delete(schema.siteWebPushSubscriptions)
    .where(eq(schema.siteWebPushSubscriptions.endpoint, input.endpoint));
}

export async function deletePushSubscriptions(ids: number[]) {
  if (ids.length === 0) return;
  await db
    .delete(schema.pushSubscriptions)
    .where(inArray(schema.pushSubscriptions.id, ids));
}

// ─── Community push gate ────────────────────────────────────────────────────
//
// Both lookups fail open. They sit on the path of ordinary learner actions
// (posting, replying, messaging), and a preferences problem must never stop
// one of those; the worst case is a push the learner had switched off.

/** The subset of `userIds` who switched community pushes off. */
export async function listUsersWithCommunityPushOff(
  userIds: string[],
): Promise<Set<string>> {
  if (userIds.length === 0) return new Set();
  try {
    const rows = await db
      .select({ userId: preferences.userId })
      .from(preferences)
      .where(
        and(
          inArray(preferences.userId, userIds),
          eq(preferences.communityEnabled, false),
        ),
      );
    return new Set(rows.map((row) => row.userId));
  } catch (error) {
    console.error("Community push preference lookup failed:", error);
    return new Set();
  }
}

/** No saved row means allowed. */
export async function isCommunityPushAllowed(userId: string) {
  return !(await listUsersWithCommunityPushOff([userId])).has(userId);
}

// ─── Reminder audience ──────────────────────────────────────────────────────

export type ReminderAudienceSubscription = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type ReminderAudienceMember = {
  userId: string;
  subscriptions: ReminderAudienceSubscription[];
  preferences: ReminderPreferences;
  /** The learner saved the reminders step (not merely that a row exists). */
  hasSavedReminders: boolean;
  /** The cohort reminders are about, chosen by dates; null when none. */
  cohort: ReminderCohort | null;
};

type SubscriptionRow = {
  subscription: typeof schema.pushSubscriptions.$inferSelect;
  preferences: ReminderPreferenceRow | null;
};

async function loadSubscriptionRows(): Promise<SubscriptionRow[]> {
  try {
    return await db
      .select({
        subscription: schema.pushSubscriptions,
        preferences,
      })
      .from(schema.pushSubscriptions)
      .leftJoin(
        preferences,
        eq(preferences.userId, schema.pushSubscriptions.userId),
      );
  } catch (error) {
    // Keeps reminders flowing on defaults if preferences cannot be read (for
    // example the code is live before migration 0048 has been applied).
    console.error("Reminder preferences could not be read:", error);
    const rows = await db.select().from(schema.pushSubscriptions);
    return rows.map((subscription) => ({ subscription, preferences: null }));
  }
}

/**
 * Everyone who can receive a scheduled push, loaded once per dispatcher run:
 * one entry per learner with their devices, resolved preferences and cohort.
 * A learner with several enrolments still appears once.
 */
export async function listReminderAudience(
  now: Date,
): Promise<ReminderAudienceMember[]> {
  const rows = await loadSubscriptionRows();
  if (rows.length === 0) return [];

  type MemberDraft = {
    subscriptions: ReminderAudienceSubscription[];
    row: ReminderPreferenceRow | null;
  };
  const members = new Map<string, MemberDraft>();
  for (const { subscription, preferences: row } of rows) {
    const member: MemberDraft = members.get(subscription.userId) ?? {
      subscriptions: [],
      row,
    };
    member.subscriptions.push({
      id: subscription.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    });
    members.set(subscription.userId, member);
  }

  const cohortRows = await db
    .select({
      userId: schema.sogpEnrollments.userId,
      id: schema.sogpCohorts.id,
      startsAt: schema.sogpCohorts.startsAt,
      endsAt: schema.sogpCohorts.endsAt,
    })
    .from(schema.sogpEnrollments)
    .innerJoin(
      schema.sogpCohorts,
      eq(schema.sogpEnrollments.cohortId, schema.sogpCohorts.id),
    )
    .where(
      and(
        inArray(
          schema.sogpEnrollments.userId,
          db
            .select({ userId: schema.pushSubscriptions.userId })
            .from(schema.pushSubscriptions),
        ),
        // Dates decide which cohort is current; status only rules out cohorts
        // that were never opened or have been put away.
        notInArray(schema.sogpCohorts.status, ["draft", "archived"]),
        gte(
          schema.sogpCohorts.endsAt,
          new Date(now.getTime() - WEEKLY_GRACE_MS),
        ),
      ),
    );

  const cohortsByUser = new Map<string, typeof cohortRows>();
  for (const row of cohortRows) {
    const list = cohortsByUser.get(row.userId) ?? [];
    list.push(row);
    cohortsByUser.set(row.userId, list);
  }

  return [...members.entries()].map(([userId, member]) => {
    const chosen = chooseReminderCohort(cohortsByUser.get(userId) ?? [], now);
    return {
      userId,
      subscriptions: member.subscriptions,
      preferences: resolveReminderPreferences(member.row),
      hasSavedReminders: Boolean(member.row?.remindersSavedAt),
      cohort: chosen
        ? {
            id: chosen.id,
            startsAt: chosen.startsAt,
            endsAt: chosen.endsAt,
            startDateKey: toLagosDateKey(chosen.startsAt),
          }
        : null,
    };
  });
}
