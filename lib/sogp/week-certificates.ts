import { percent } from "./assessment";
import type { SogpCurriculumLevel } from "./curriculum";
import type { SogpAssessmentPolicy, SogpEnrollmentStatus } from "./types";

/**
 * Week certificates: one per SOGP week a learner completes, issued
 * automatically before the final cohort certificate. Week N is SOGP level N,
 * the cohort's Nth Monday-to-Sunday block of dates.
 *
 * A week is complete when all six of its teachings are complete and the
 * learner kept up with that week's morning Prayer Watch and required reviews
 * to the cohort's own certificate percentages. Pure: no database or Node
 * imports, so client components can share it.
 */

export type SogpWeekNumber = SogpCurriculumLevel;

export const SOGP_CERTIFICATE_WEEKS = [1, 2, 3, 4] as const satisfies readonly SogpWeekNumber[];
export const SOGP_TRACKS_PER_WEEK = 6;
export const SOGP_DAYS_PER_WEEK = 7;

export type SogpWeekRequirementKey = "teachings" | "prayer_watch" | "reviews";

export type SogpWeekRequirement = {
  completed: number;
  total: number;
  /** Fewest completions that meet the policy; 0 when there is nothing to do. */
  needed: number;
  met: boolean;
};

export type SogpWeekAwardSummary = {
  week: SogpWeekNumber;
  startDateKey: string | null;
  endDateKey: string | null;
  teachings: SogpWeekRequirement;
  prayerWatch: SogpWeekRequirement;
  reviews: SogpWeekRequirement;
  eligible: boolean;
  unmet: SogpWeekRequirementKey[];
};

export function isSogpWeekNumber(value: number): value is SogpWeekNumber {
  return (SOGP_CERTIFICATE_WEEKS as readonly number[]).includes(value);
}

/** The fewest of `total` that reach `requiredPercent`, rounded as the rules round. */
export function minimumToMeetPercent(total: number, requiredPercent: number) {
  if (total <= 0) return 0;
  for (let count = 0; count <= total; count += 1) {
    if (percent(count, total) >= requiredPercent) return count;
  }
  return total;
}

function requirement(input: {
  completed: number;
  total: number;
  requiredPercent: number;
  metWhenEmpty: boolean;
}): SogpWeekRequirement {
  if (input.total <= 0) {
    return { completed: 0, total: 0, needed: 0, met: input.metWhenEmpty };
  }
  const completed = Math.min(Math.max(input.completed, 0), input.total);
  return {
    completed,
    total: input.total,
    needed: minimumToMeetPercent(input.total, input.requiredPercent),
    met: percent(completed, input.total) >= input.requiredPercent,
  };
}

export function summarizeSogpWeekAwards(input: {
  /** Every Lagos date of the cohort, in order (`buildSogpDateKeys`). */
  dateKeys: string[];
  /** Required tracks only. */
  tracks: Array<{ curriculumLevel: number; assessmentComplete: boolean }>;
  prayerDateKeys: ReadonlySet<string>;
  /** Required, non-cancelled reviews, by the Lagos date they are held. */
  reviews: Array<{ dateKey: string; complete: boolean }>;
  policy: SogpAssessmentPolicy;
}): SogpWeekAwardSummary[] {
  return SOGP_CERTIFICATE_WEEKS.map((week) => {
    // Anything past the fourth week (the seed can add a 29th date) belongs
    // to no week.
    const dates = input.dateKeys.slice(
      (week - 1) * SOGP_DAYS_PER_WEEK,
      week * SOGP_DAYS_PER_WEEK,
    );
    const weekDates = new Set(dates);
    const weekReviews = input.reviews.filter((review) =>
      weekDates.has(review.dateKey),
    );

    const teachings = requirement({
      completed: input.tracks.filter(
        (track) => track.curriculumLevel === week && track.assessmentComplete,
      ).length,
      // Always out of six, so a week whose teachings are only partly
      // scheduled cannot be awarded early.
      total: SOGP_TRACKS_PER_WEEK,
      requiredPercent: input.policy.requiredTrackCompletionPercent,
      metWhenEmpty: false,
    });
    const prayerWatch = requirement({
      completed: dates.filter((dateKey) => input.prayerDateKeys.has(dateKey))
        .length,
      total: dates.length,
      requiredPercent: input.policy.requiredPrayerWatchPercent,
      metWhenEmpty: false,
    });
    const reviews = requirement({
      completed: weekReviews.filter((review) => review.complete).length,
      total: weekReviews.length,
      requiredPercent: input.policy.requiredLiveClassPercent,
      // Older cohorts never created reviews for days that had already
      // passed, so a week without any cannot hold a learner back.
      metWhenEmpty: true,
    });

    const unmet: SogpWeekRequirementKey[] = [];
    if (!teachings.met) unmet.push("teachings");
    if (!prayerWatch.met) unmet.push("prayer_watch");
    if (!reviews.met) unmet.push("reviews");

    return {
      week,
      startDateKey: dates[0] ?? null,
      endDateKey: dates.at(-1) ?? null,
      teachings,
      prayerWatch,
      reviews,
      eligible: unmet.length === 0,
      unmet,
    };
  });
}

/** Weeks newly due a certificate; a revoked row still blocks re-issue. */
export function selectWeeksToAward(input: {
  summaries: SogpWeekAwardSummary[];
  existingWeeks: ReadonlySet<number>;
  enrollmentStatus: SogpEnrollmentStatus;
}): SogpWeekNumber[] {
  if (input.enrollmentStatus === "withdrawn") return [];
  return input.summaries
    .filter((summary) => summary.eligible && !input.existingWeeks.has(summary.week))
    .map((summary) => summary.week);
}

export function buildSogpWeekVerificationCode(week: SogpWeekNumber, hex: string) {
  return `SOGP-W${week}-${hex.toUpperCase()}`;
}

/** "1", "1 and 2", "1, 2 and 3". */
export function formatSogpWeekList(weeks: number[]) {
  const sorted = [...new Set(weeks)].sort((a, b) => a - b).map(String);
  if (sorted.length <= 1) return sorted.join("");
  return `${sorted.slice(0, -1).join(", ")} and ${sorted.at(-1)}`;
}

/** "Week 1 certificate" or "Week 1 and 2 certificates". */
export function describeSogpWeekCertificates(weeks: number[]) {
  const count = new Set(weeks).size;
  return `Week ${formatSogpWeekList(weeks)} ${count === 1 ? "certificate" : "certificates"}`;
}

/** Push text: week numbers only, never names or titles. */
export function sogpWeekCertificatePushBody(weeks: number[]) {
  const count = new Set(weeks).size;
  return `Your ${describeSogpWeekCertificates(weeks)} ${count === 1 ? "is" : "are"} ready.`;
}

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

/** "2 teachings, 1 Prayer Watch day and 1 review to go"; empty when nothing is left. */
export function describeSogpWeekGap(summary: SogpWeekAwardSummary) {
  const parts: string[] = [];
  const teachings = summary.teachings.needed - summary.teachings.completed;
  const prayer = summary.prayerWatch.needed - summary.prayerWatch.completed;
  const reviews = summary.reviews.needed - summary.reviews.completed;
  if (!summary.teachings.met && teachings > 0) {
    parts.push(plural(teachings, "teaching"));
  }
  if (!summary.prayerWatch.met && prayer > 0) {
    parts.push(plural(prayer, "Prayer Watch day"));
  }
  if (!summary.reviews.met && reviews > 0) {
    parts.push(plural(reviews, "review"));
  }
  if (parts.length === 0) return "";
  const list =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`;
  return `${list} to go`;
}

export function buildSogpWeekCertificateShareMessage(input: {
  week: number;
  title: string;
}) {
  return `I've completed Week ${input.week} of the School of God's Purpose: ${input.title}. SOGP is a free four-week journey to discover God's purpose. Join the next cohort free here:`;
}
