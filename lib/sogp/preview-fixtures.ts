import type {
  PreSogpJourneyData,
  SogpJourneyData,
} from "@/lib/db/queries/sogp-journey";
import type { ReferralsDashboardData } from "@/lib/db/queries/sogp-referrals";
import type { DiscipleshipDashboardData } from "@/lib/db/queries/sogp-discipleship";

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
    const lessonComplete = index < 5;
    const prayerWatchComplete = index < 5 || (index < 8 && index % 2 === 0);
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
      quizPassed: assessmentComplete,
      writtenResponseStatus: assessmentComplete ? "approved" : null,
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


export const referralsPreviewData: ReferralsDashboardData = {
  referralCode: "a1b2c3d4",
  referralUrl: "https://pleros.org/sogp?ref=a1b2c3d4",
  referredCount: 3,
  preparationDaysTotal: 14,
  referred: [
    {
      firstName: "Grace",
      joinedAt: "2026-08-28T09:00:00.000Z",
      stage: "preparing",
      preparationDaysComplete: 6,
    },
    {
      firstName: "Samuel",
      joinedAt: "2026-08-30T14:30:00.000Z",
      stage: "enrolled",
      preparationDaysComplete: 0,
    },
    {
      firstName: "Blessing",
      joinedAt: "2026-08-22T18:15:00.000Z",
      stage: "in_course",
      preparationDaysComplete: 14,
    },
  ],
};

const discipleBase = {
  preparationDaysTotal: 14,
  coreTotal: 24,
  prayerTotal: 28,
  reviewsTotal: 28,
};

export const discipleshipPreviewData: DiscipleshipDashboardData = {
  viewer: { enrollmentId: 1, firstName: "Tola" },
  ledGroups: [
    { id: 1, name: "Tola's discipleship group", status: "active", discipleCount: 3 },
    { id: 2, name: "Campus fellowship", status: "active", discipleCount: 0 },
  ],
  createGroupBlock: null,
  selectedGroup: {
    id: 1,
    name: "Tola's discipleship group",
    inviteUrl: "https://pleros.org/sogp/discipleship/ab12cd34",
    leaderSharesPhone: true,
    status: "active",
    disciples: [
      {
        ...discipleBase,
        membershipId: 1,
        enrollmentId: 2,
        name: "Grace Adeyemi",
        firstName: "Grace",
        joinedAt: "2026-08-28T09:00:00.000Z",
        status: "on_track",
        preparationDaysComplete: 14,
        coreCompleted: 9,
        prayerCompleted: 10,
        prayerPercent: 90,
        reviewsCompleted: 10,
        averageQuizScore: 86,
        eligible: true,
        lastActiveAt: "2026-09-24T05:40:00.000Z",
        whatsappUrl: "https://wa.me/2348031234567",
        lastContactedAt: "2026-09-23T18:00:00.000Z",
        contactCount: 6,
        nudgedToday: false,
        openPrayerCount: 1,
        recentContacts: [
          { id: 3, kind: "call", note: "Talked about her new job.", createdAt: "2026-09-23T18:00:00.000Z" },
          { id: 2, kind: "nudge", note: "I'm praying for you today.", createdAt: "2026-09-20T07:00:00.000Z" },
        ],
      },
      {
        ...discipleBase,
        membershipId: 2,
        enrollmentId: 3,
        name: "Samuel Okafor",
        firstName: "Samuel",
        joinedAt: "2026-08-30T14:30:00.000Z",
        status: "declining",
        preparationDaysComplete: 8,
        coreCompleted: 4,
        prayerCompleted: 5,
        prayerPercent: 45,
        reviewsCompleted: 3,
        averageQuizScore: 72,
        eligible: false,
        lastActiveAt: "2026-09-19T20:10:00.000Z",
        whatsappUrl: null,
        lastContactedAt: "2026-09-12T10:00:00.000Z",
        contactCount: 2,
        nudgedToday: false,
        openPrayerCount: 0,
        recentContacts: [
          { id: 1, kind: "message", note: null, createdAt: "2026-09-12T10:00:00.000Z" },
        ],
      },
      {
        ...discipleBase,
        membershipId: 3,
        enrollmentId: 4,
        name: "Blessing Eze",
        firstName: "Blessing",
        joinedAt: "2026-09-02T18:15:00.000Z",
        status: "at_risk",
        preparationDaysComplete: 2,
        coreCompleted: 0,
        prayerCompleted: 1,
        prayerPercent: 9,
        reviewsCompleted: 0,
        averageQuizScore: null,
        eligible: false,
        lastActiveAt: null,
        whatsappUrl: "https://wa.me/2348091234567",
        lastContactedAt: null,
        contactCount: 0,
        nudgedToday: false,
        openPrayerCount: 0,
        recentContacts: [],
      },
    ],
    prompts: [
      {
        id: 2,
        body: "What did God teach you through this week's teachings?",
        createdAt: "2026-09-21T07:00:00.000Z",
        responses: [
          {
            id: 1,
            discipleEnrollmentId: 2,
            discipleFirstName: "Grace",
            body: "The Walk of Faith teaching reminded me to trust God with my next step at work.",
            updatedAt: "2026-09-21T19:30:00.000Z",
            leaderReply: "Amen, Grace. I'm praying with you about this.",
            leaderRepliedAt: "2026-09-22T06:00:00.000Z",
          },
        ],
      },
      {
        id: 1,
        body: "How can I pray for you this week?",
        createdAt: "2026-09-14T07:00:00.000Z",
        responses: [],
      },
    ],
    prayerRequests: [
      {
        id: 1,
        discipleFirstName: "Grace",
        body: "Please pray for wisdom as I settle into my new role at work.",
        status: "open",
        answerNote: null,
        prayedAt: null,
        answeredAt: null,
        createdAt: "2026-09-22T19:00:00.000Z",
      },
    ],
    promptSuggestions: {
      levelTitle: "Gospel foundations and the Spirit",
      suggestions: [
        'What stood out to you in "Discipline – The Drive of the Spirit"?',
        'How will you live out "Gospel foundations and the Spirit" this week?',
        'How can I pray for you as you study "Faith Stand: How to Grow in Christ"?',
      ],
    },
  },
  myDiscipler: {
    groupName: "Kemi's discipleship group",
    leaderFirstName: "Kemi",
    leaderName: "Kemi Balogun",
    whatsappUrl: "https://wa.me/2348021234567",
    sharesPhone: true,
    joinedAt: "2026-08-25T10:00:00.000Z",
    prompts: [
      {
        id: 10,
        body: "What is one thing you will put into practice from today's lesson?",
        createdAt: "2026-09-23T07:00:00.000Z",
        response: null,
      },
    ],
    prayerRequests: [
      {
        id: 20,
        discipleFirstName: "Tola",
        body: "Pray for my family's health this month.",
        status: "open",
        answerNote: null,
        prayedAt: "2026-09-21T06:30:00.000Z",
        answeredAt: null,
        createdAt: "2026-09-20T21:00:00.000Z",
      },
    ],
  },
  participationRange: { start: "2026-09-01", end: sogpTodayKey },
};
