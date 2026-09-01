import type {
  PreSogpJourneyData,
  SogpJourneyData,
} from "@/lib/db/queries/sogp-journey";

import {
  buildPreparationDateKeys,
  buildSogpDateKeys,
  deriveSogpCalendarState,
} from "./calendar";
import { SOGP_LEVELS, SOGP_TRACKS } from "./curriculum";
import { getPreparationRequirements, getSogpDayRequirements } from "./journey";
import { buildPreSogpSeed } from "./preparation-seed";

const cohortStartsAt = new Date("2026-09-14T06:00:00+01:00");
const cohortEndsAt = new Date("2026-10-11T20:00:00+01:00");
const preparationStartsAt = new Date("2026-09-01T00:00:00+01:00");
const preparationTodayKey = "2026-08-31";
const sogpTodayKey = "2026-09-24";

const preparationSeed = buildPreSogpSeed(preparationStartsAt);
const preparationDates = buildPreparationDateKeys(preparationStartsAt);

export const preSogpPreviewData: PreSogpJourneyData = {
  generatedAt: "2026-08-31T12:00:00.000Z",
  todayKey: preparationTodayKey,
  cohort: {
    id: 1,
    title: "SOGP September 2026",
    startsAt: cohortStartsAt.toISOString(),
    telegramUrl: "https://t.me/pleros_sogp",
  },
  countdown: {
    days: 1,
    label: "Pre-SOGP begins tomorrow",
    phase: "upcoming",
  },
  days: preparationDates.map((dateKey, index) => {
    const seededLesson = preparationSeed[index]!;
    const lessonComplete = index < 10;
    const prayerWatchComplete = index < 10 || (index < 15 && index % 2 === 0);
    const available = dateKey <= preparationTodayKey;
    return {
      id: index + 1,
      dayNumber: index + 1,
      dateKey,
      state: deriveSogpCalendarState({
        dateKey,
        todayKey: preparationTodayKey,
        requirements: getPreparationRequirements({
          lessonComplete,
          prayerWatchComplete,
        }),
      }),
      lessonComplete,
      prayerWatchComplete,
      lesson: available
        ? {
            title: seededLesson.title,
            description: seededLesson.introduction,
            url: seededLesson.url,
          }
        : null,
    };
  }),
};

const sogpDates = buildSogpDateKeys(cohortStartsAt, cohortEndsAt);
let teachingIndex = 0;
let reviewIndex = 0;

const sogpDays: SogpJourneyData["days"] = sogpDates.map((dateKey) => {
  const weekday = new Date(`${dateKey}T00:00:00Z`).getUTCDay();
  const prayerWatchComplete = dateKey < sogpTodayKey && weekday !== 0;

  if (weekday === 0) {
    const currentReview = reviewIndex++;
    const complete = currentReview === 0;
    return {
      dateKey,
      kind: "review",
      state: deriveSogpCalendarState({
        dateKey,
        todayKey: sogpTodayKey,
        requirements: getSogpDayRequirements({
          kind: "review",
          prayerWatchComplete,
          reviewComplete: complete,
        }),
      }),
      prayerWatchComplete,
      track: null,
      review: {
        id: currentReview + 1,
        title: `Level ${currentReview + 1} live review`,
        startsAt: `${dateKey}T15:00:00.000Z`,
        endsAt: `${dateKey}T17:00:00.000Z`,
        liveUrl: "https://www.youtube.com/@PlerosLive",
        recordingUrl: currentReview === 0
          ? "https://www.youtube.com/@PlerosLive"
          : null,
        complete,
        completionSource: complete ? "live" : null,
      },
    };
  }

  const track = SOGP_TRACKS[teachingIndex++]!;
  const assessmentComplete = track.curriculumOrder <= 8;
  const previousLevelComplete = track.curriculumLevel <= 2;
  const released = dateKey <= sogpTodayKey;
  const accessible = released && previousLevelComplete;
  return {
    dateKey,
    kind: "weekday",
    state: deriveSogpCalendarState({
      dateKey,
      todayKey: sogpTodayKey,
      requirements: getSogpDayRequirements({
        kind: "weekday",
        prayerWatchComplete,
        assessmentComplete,
      }),
    }),
    prayerWatchComplete,
    track: {
      id: track.curriculumOrder,
      dayNumber: track.curriculumOrder,
      curriculumLevel: track.curriculumLevel,
      levelPosition: track.levelPosition,
      title: track.title,
      audioUrl: accessible
        ? "https://res.cloudinary.com/dxajhzf4d/video/upload/v1786094111/samples/Music/Audio%20Book/wtp-1_fnvl3n.mp3"
        : null,
      assessmentComplete,
      assessmentHref: "#",
      reviewState: assessmentComplete ? "approved" : null,
      accessible,
      lockedReason: accessible
        ? null
        : released
          ? `Complete all six Level ${track.curriculumLevel - 1} assessments first.`
          : "This track opens on its scheduled day.",
    },
    review: null,
  };
});

export const sogpPreviewData: SogpJourneyData = {
  generatedAt: "2026-09-24T12:00:00.000Z",
  todayKey: sogpTodayKey,
  enrollment: { name: "Daniel" },
  cohort: {
    title: "SOGP September 2026",
    startsAt: cohortStartsAt.toISOString(),
    endsAt: cohortEndsAt.toISOString(),
    telegramUrl: "https://t.me/pleros_sogp",
  },
  levels: SOGP_LEVELS.map((level) => ({
    level: level.level,
    title: level.title,
    description: level.description,
    status:
      level.level === 1
        ? "complete"
        : level.level === 2
          ? "in_progress"
          : "locked",
    completed: level.level === 1 ? 6 : level.level === 2 ? 2 : 0,
    total: 6,
    unlocksAt: new Date(
      cohortStartsAt.getTime() + (level.level - 1) * 7 * 86_400_000,
    ).toISOString(),
  })),
  days: sogpDays,
  progress: {
    coreCompleted: 8,
    coreTotal: 24,
    prayerCompleted: 9,
    prayerTotal: 28,
    prayerPercent: 32,
    reviewsCompleted: 1,
    reviewsTotal: 4,
    eligible: false,
  },
};
