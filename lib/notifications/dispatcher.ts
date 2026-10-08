import { fetchAnchorEpisodes } from "@/lib/anchor-rss";
import {
  claimCheckpoint,
  getCheckpointValue,
  releaseCheckpoint,
  setCheckpointValue,
} from "@/lib/db/queries/notification-checkpoints";
import {
  listReminderAudience,
  type ReminderAudienceMember,
} from "@/lib/db/queries/notification-preferences";
import {
  getActiveSogpJourney,
  getPreSogpJourney,
} from "@/lib/db/queries/sogp-journey";
import { getLatestYoutubeEpisode } from "@/lib/homepage-feed";
import { PRAYER_WATCH_SESSIONS, PRAYER_WATCH_TIME_ZONE } from "@/lib/prayer-watch";
import { sendPushToSubscriptions, type PushPayload } from "@/lib/push/send";
import { isPushEnabled } from "@/lib/push/web-push";

import {
  NUDGE_WINDOW_MS,
  PRAYER_WATCH_WINDOW_MS,
  TEACHING_WINDOW_MS,
  WEEKLY_WINDOW_MS,
  buildNewContentPush,
  buildNudgePush,
  buildPrayerWatchPush,
  buildTeachingPush,
  buildWeeklySummary,
  buildWeeklySummaryPush,
  isActiveJourneyForCohort,
  isCohortRunning,
  isFreshContent,
  isMonday,
  isPreparationJourneyForCohort,
  isWeeklySummaryEligible,
  localSlots,
  nudgeDue,
  pickNudgeTarget,
  pickPreparationNudgeTarget,
  pickPreparationTarget,
  pickTeachingTarget,
  prayerWatchDue,
  reminderKeys,
  shouldSkipNudge,
  slotPhase,
  teachingDue,
  wantsPrayerWatchReminder,
  weeklyDue,
  type NewContentSource,
  type ReminderCohort,
} from "./reminder-plan";
import { getZonedParts, isDue } from "./zoned-time";

/**
 * The reminder dispatcher, run by `/api/cron/reminder-dispatch` every five
 * minutes. It owns every scheduled learner push: Prayer Watch, the teaching
 * reminder, the evening nudge, the weekly summary and new-content alerts.
 *
 * The contract every step follows:
 *   1. work out a due instant and check it against a window (never an exact
 *      minute), so a late run still delivers;
 *   2. claim a dated checkpoint key before doing anything else, so two
 *      overlapping runs cannot both send;
 *   3. if the step fails after claiming, give the claim back so the next run
 *      inside the window retries.
 *
 * All rules live in `reminder-plan.ts`; this file only loads data and sends.
 */

/** Learners are processed a few at a time; each may need a journey lookup. */
const CONCURRENCY = 8;

export type ReminderDispatchResult = {
  skipped: "push_disabled" | null;
  audience: number;
  prayerWatch: number;
  teaching: number;
  nudges: number;
  weekly: number;
  newContent: number;
  /** Expired device subscriptions removed while sending. */
  prunedSubscriptions: number;
  /** Learners whose reminder failed and will be retried by a later run. */
  failures: number;
  /** Names of steps that could not run at all. */
  errors: string[];
};

type Counter = "prayerWatch" | "teaching" | "nudges" | "weekly" | "newContent";

type Member = ReminderAudienceMember;
type EnrolledMember = Member & { cohort: ReminderCohort };

function emptyResult(): ReminderDispatchResult {
  return {
    skipped: null,
    audience: 0,
    prayerWatch: 0,
    teaching: 0,
    nudges: 0,
    weekly: 0,
    newContent: 0,
    prunedSubscriptions: 0,
    failures: 0,
    errors: [],
  };
}

/** Runs `worker` over `items`, at most `CONCURRENCY` at a time. */
async function forEachLimited<Item>(
  items: Item[],
  worker: (item: Item) => Promise<void>,
) {
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const item = items[next]!;
      next += 1;
      await worker(item);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, lane),
  );
}

async function deliver(
  result: ReminderDispatchResult,
  counter: Counter,
  member: Member,
  payload: PushPayload,
) {
  const outcome = await sendPushToSubscriptions(member.subscriptions, payload);
  result.prunedSubscriptions += outcome.pruned;
  if (outcome.delivered > 0) {
    result[counter] += 1;
    return;
  }
  // Every device failed for a reason other than "gone": treat it as a failure
  // so the caller can release its claim and a later run tries again.
  if (outcome.failed > 0) {
    throw new Error("Push delivery failed on every device.");
  }
}

/**
 * Claims `key`, then runs `work`. A failure after the claim releases it, so
 * the reminder is retried by the next run rather than lost for the day.
 */
async function claimThen(
  result: ReminderDispatchResult,
  key: string,
  work: () => Promise<void>,
) {
  let claimed = false;
  try {
    claimed = await claimCheckpoint(key);
    if (!claimed) return;
    await work();
  } catch (error) {
    result.failures += 1;
    console.error(`Reminder ${key} failed:`, error);
    if (claimed) {
      await releaseCheckpoint(key).catch(() => undefined);
    }
  }
}

function hasRunningCohort(member: Member, now: Date): member is EnrolledMember {
  return member.cohort !== null && isCohortRunning(member.cohort, now);
}

// ─── Journeys ───────────────────────────────────────────────────────────────
//
// The journey loaders are the same ones the dashboards use, so a reminder
// never disagrees with the page it opens. A journey that belongs to a
// different cohort (a returning learner) is ignored.

async function loadActiveDays(member: EnrolledMember, now: Date) {
  const journey = await getActiveSogpJourney(member.userId, now);
  if (!journey || !isActiveJourneyForCohort(journey, member.cohort)) return null;
  return journey.days;
}

async function loadPreparationDays(member: EnrolledMember, now: Date) {
  const journey = await getPreSogpJourney(member.userId, now);
  if (!journey || !isPreparationJourneyForCohort(journey, member.cohort)) {
    return null;
  }
  return journey.days;
}

// ─── Steps ──────────────────────────────────────────────────────────────────

/** Fixed on Lagos time: ten minutes before each session, never after it. */
async function sendPrayerWatchReminders(
  now: Date,
  audience: Member[],
  result: ReminderDispatchResult,
) {
  const lagosDateKey = getZonedParts(now, PRAYER_WATCH_TIME_ZONE).dateKey;

  for (const session of PRAYER_WATCH_SESSIONS) {
    const due = prayerWatchDue(session, lagosDateKey);
    if (!isDue(due, now, PRAYER_WATCH_WINDOW_MS)) continue;

    // Enrolled learners get their saved choice or the default (morning only).
    // Anyone else only once they have saved the reminders step themselves.
    const recipients = audience.filter(
      (member) =>
        wantsPrayerWatchReminder(member.preferences, session.id) &&
        (member.hasSavedReminders || hasRunningCohort(member, now)),
    );

    await forEachLimited(recipients, (member) =>
      claimThen(
        result,
        reminderKeys.prayerWatch(session.id, lagosDateKey, member.userId),
        async () => {
          const phase = hasRunningCohort(member, now)
            ? slotPhase(lagosDateKey, member.cohort)
            : null;
          await deliver(
            result,
            "prayerWatch",
            member,
            buildPrayerWatchPush(session, lagosDateKey, phase),
          );
        },
      ),
    );
  }
}

/** The learner's chosen local time, about a teaching they can open now. */
async function sendTeachingReminders(
  now: Date,
  audience: Member[],
  result: ReminderDispatchResult,
) {
  const candidates = audience.filter(
    (member): member is EnrolledMember =>
      hasRunningCohort(member, now) &&
      member.preferences.teachingReminderEnabled &&
      member.preferences.teachingTimeMinutes !== null,
  );

  await forEachLimited(candidates, async (member) => {
    const { timeZone, teachingTimeMinutes } = member.preferences;
    if (teachingTimeMinutes === null) return;

    for (const dateKey of localSlots(now, timeZone)) {
      const phase = slotPhase(dateKey, member.cohort);
      const due = teachingDue({
        dateKey,
        minutes: teachingTimeMinutes,
        timeZone,
        phase,
      });
      if (!isDue(due, now, TEACHING_WINDOW_MS)) continue;

      await claimThen(
        result,
        reminderKeys.teaching(member.userId, dateKey),
        async () => {
          const target =
            phase === "active"
              ? pickTeachingTarget(
                  (await loadActiveDays(member, now)) ?? [],
                  dateKey,
                )
              : pickPreparationTarget(
                  (await loadPreparationDays(member, now)) ?? [],
                  dateKey,
                );
          // Nothing left to do for this day: keep the claim and stay silent.
          if (!target) return;
          await deliver(
            result,
            "teaching",
            member,
            buildTeachingPush(target, phase),
          );
        },
      );
    }
  });
}

/** 7:00 pm local, only when the day's own teaching is still unfinished. */
async function sendProgressNudges(
  now: Date,
  audience: Member[],
  result: ReminderDispatchResult,
) {
  const candidates = audience.filter(
    (member): member is EnrolledMember =>
      hasRunningCohort(member, now) &&
      member.preferences.progressNudgesEnabled &&
      !shouldSkipNudge(member.preferences),
  );

  await forEachLimited(candidates, async (member) => {
    const { timeZone } = member.preferences;

    for (const dateKey of localSlots(now, timeZone)) {
      if (!isDue(nudgeDue(dateKey, timeZone), now, NUDGE_WINDOW_MS)) continue;

      await claimThen(
        result,
        reminderKeys.nudge(member.userId, dateKey),
        async () => {
          const phase = slotPhase(dateKey, member.cohort);
          const target =
            phase === "active"
              ? pickNudgeTarget(
                  (await loadActiveDays(member, now)) ?? [],
                  dateKey,
                )
              : pickPreparationNudgeTarget(
                  (await loadPreparationDays(member, now)) ?? [],
                  dateKey,
                );
          if (!target) return;
          await deliver(result, "nudges", member, buildNudgePush(target, phase));
        },
      );
    }
  });
}

/** Monday 8:00 am local, counts for the seven days before it. */
async function sendWeeklySummaries(
  now: Date,
  audience: Member[],
  result: ReminderDispatchResult,
) {
  const candidates = audience.filter(
    (member): member is EnrolledMember =>
      member.cohort !== null &&
      isWeeklySummaryEligible(member.cohort, now) &&
      member.preferences.weeklySummaryEnabled,
  );

  await forEachLimited(candidates, async (member) => {
    const { timeZone } = member.preferences;

    for (const dateKey of localSlots(now, timeZone)) {
      if (!isMonday(dateKey)) continue;
      if (!isDue(weeklyDue(dateKey, timeZone), now, WEEKLY_WINDOW_MS)) continue;

      await claimThen(
        result,
        reminderKeys.weekly(member.userId, dateKey),
        async () => {
          const days = await loadActiveDays(member, now);
          const summary = days ? buildWeeklySummary(days, dateKey) : null;
          if (!summary) return;
          await deliver(
            result,
            "weekly",
            member,
            buildWeeklySummaryPush(summary),
          );
        },
      );
    }
  });
}

type LatestContent = { id: string; title: string; publishedAt: string };

async function loadLatestContent(
  source: NewContentSource,
): Promise<LatestContent | null> {
  if (source === "youtube") {
    const video = await getLatestYoutubeEpisode();
    return video
      ? { id: video.id, title: video.title, publishedAt: video.publishedAt }
      : null;
  }

  const episodes = await fetchAnchorEpisodes();
  let latest: LatestContent | null = null;
  let latestTime = Number.NEGATIVE_INFINITY;
  for (const episode of episodes) {
    const publishedAt = episode.pubDate || episode.isoDate;
    const time = Date.parse(publishedAt);
    if (!episode.guid || Number.isNaN(time) || time <= latestTime) continue;
    latestTime = time;
    latest = { id: episode.guid, title: episode.title, publishedAt };
  }
  return latest;
}

/**
 * A new podcast episode or video, at most one alert per Lagos day. The last
 * seen id is recorded before anything is sent, and the first sighting of a
 * source only records it, so a deploy never announces old content.
 */
async function sendNewContentAlerts(
  now: Date,
  audience: Member[],
  result: ReminderDispatchResult,
) {
  const recipients = audience.filter(
    (member) => member.preferences.newContentEnabled,
  );
  const lagosDateKey = getZonedParts(now, PRAYER_WATCH_TIME_ZONE).dateKey;
  const sources: NewContentSource[] = ["podcast", "youtube"];

  for (const source of sources) {
    // A failed or empty fetch must never be recorded or compared.
    const latest = await loadLatestContent(source);
    if (!latest) continue;

    const lastKey = reminderKeys.contentLast(source);
    const lastSeen = await getCheckpointValue(lastKey);
    if (lastSeen === latest.id) continue;

    await setCheckpointValue(lastKey, latest.id);
    if (lastSeen === null) continue;
    if (!isFreshContent(latest.publishedAt, now)) continue;
    if (recipients.length === 0) continue;

    // This claim is never released: one alert a day, whatever happens next.
    const claimed = await claimCheckpoint(
      reminderKeys.contentDay(lagosDateKey),
      `${source}:${latest.id}`,
    );
    if (!claimed) continue;

    const payload = buildNewContentPush(source, latest.title);
    await forEachLimited(recipients, async (member) => {
      try {
        await deliver(result, "newContent", member, payload);
      } catch (error) {
        result.failures += 1;
        console.error(`New content alert failed for ${source}:`, error);
      }
    });
  }
}

// ─── Entry point ────────────────────────────────────────────────────────────

export async function runReminderDispatcher(
  now = new Date(),
): Promise<ReminderDispatchResult> {
  const result = emptyResult();

  if (!isPushEnabled()) {
    result.skipped = "push_disabled";
    return result;
  }

  let audience: Member[];
  try {
    audience = await listReminderAudience(now);
  } catch (error) {
    console.error("Reminder audience could not be loaded:", error);
    result.errors.push("audience");
    return result;
  }
  result.audience = audience.length;
  if (audience.length === 0) return result;

  // One step failing must never stop the others.
  const steps: Array<[string, () => Promise<void>]> = [
    ["prayer_watch", () => sendPrayerWatchReminders(now, audience, result)],
    ["teaching", () => sendTeachingReminders(now, audience, result)],
    ["nudges", () => sendProgressNudges(now, audience, result)],
    ["weekly", () => sendWeeklySummaries(now, audience, result)],
    ["new_content", () => sendNewContentAlerts(now, audience, result)],
  ];
  for (const [name, run] of steps) {
    try {
      await run();
    } catch (error) {
      console.error(`Reminder step ${name} failed:`, error);
      result.errors.push(name);
    }
  }

  return result;
}
