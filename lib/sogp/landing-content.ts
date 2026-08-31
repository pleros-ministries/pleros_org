import { aboutPageMinisterFollow } from "../about-page-content";
import { SOGP_LEVELS, SOGP_TRACKS } from "./curriculum";

export const sogpLandingContent = {
  hero: {
    titleLines: [
      "Find Truth,",
      "Discover God’s Purpose,",
      "Grow to fulfil it,",
      "with the School of God’s Purpose",
    ],
    description:
      "Get answers to difficult questions about God, gain clarity on God’s purpose for your life, and receive the transformation and empowerment needed to fulfil it.",
    ctaHref: "/sogp/enrol",
  },
  ctas: {
    hero: "Enrol to get started",
    early: "Begin your enrolment",
    middle: "Start your journey",
    curriculum: "Enrol to start learning",
    free: "Enrol for free",
  },
  questionsTitle: "What are you seeking?",
  questions: [
    "Do you have doubts about your faith, beliefs, or religious worldview?",
    "Do you wonder what exactly your purpose in life is?",
    "Do you struggle to grow spiritually and break free from habits and addictions?",
    "Do you desire to function in the healing power and the supernatural?",
    "Do you want to walk more in the strength and power of the Spirit to fulfil God’s purpose for you?",
  ],
  introVideo: {
    title: "What is the School of God’s Purpose?",
    description:
      "Watch this short introduction to the journey you are about to begin.",
    src: "/site/sogp/sogp-welcome-square-20260831.mp4",
    posterSrc: "/site/sogp/sogp-welcome-square-20260831.jpg",
  },
  outcomes: [
    "Gain clarity on difficult questions about God, His truth, and His Word",
    "Discover God’s purpose for your life",
    "Be transformed and strengthened to walk in God’s will",
    "Learn how to receive and minister healing and the supernatural",
    "Be empowered to pursue and fulfil God’s purpose for your life",
  ],
  definition: {
    title: "What is SOGP?",
    description:
      "The School of God’s Purpose is a platform that provides you with answers to the most important questions of life in a simple, clear, well-structured and flexible manner. The goal is to give you persuasion and clarity about the truth of existence, help you discover and recognise God’s purpose for your life, and cause you to live a transformed and empowered life that fulfils God’s assignments.",
    outcomesIntro: "With SOGP, you will:",
  },
  audiences: [
    "Those in unbelief or doubt about God’s existence or the Christian faith who are seeking answers.",
    "Those with questions and doubts about God’s purpose for their lives.",
    "Those desiring spiritual growth and transformation in character, habits, and freedom from difficult addictions.",
    "Those desiring to receive and minister divine healing for themselves and others.",
    "Those desiring empowerment to do the work of ministry and to function in the supernatural.",
    "Those seeking God’s wisdom for their careers, businesses, finances, and other natural pursuits.",
    "Anyone who wants a stronger walk with God and hungers to fulfil His purpose.",
  ],
  curriculum: {
    title: "Curriculum of SOGP",
    description:
      "The curriculum of SOGP is paced to answer foundational questions, strengthen your overall doctrinal persuasion, and stir you into a practical walk with God and in His purpose.",
    levels: Object.fromEntries(
      SOGP_LEVELS.map((level) => [`Level ${level.level}`, level.description]),
    ),
    tracks: SOGP_TRACKS.map((track) => ({
      level: `Level ${track.curriculumLevel}`,
      title: track.title,
    })),
  },
  structure: {
    title: "The structure of SOGP",
    description:
      "A fixed four-week rhythm gives you clarity and accountability while preserving enough flexibility for work, school, business, and family life.",
    schedule: [
      {
        label: "Teaching days",
        meta: "Monday–Saturday",
        detail: "One guided track each day on the Pleros Dashboard",
      },
      {
        label: "Review day",
        meta: "Sunday",
        detail: "One required live review for each completed level",
      },
      {
        label: "Duration",
        meta: "Four weeks",
        detail: "24 tracks paced across the cohort",
      },
      {
        label: "Catch-up",
        meta: "Flexible",
        detail: "Complete unfinished work beyond the cohort window",
      },
    ],
  },
  enrollment: {
    title: "Enrolment requirement",
    paragraphs: [
      "The School of God’s Purpose is an extremely valuable platform that enlightens you about the truth of existence, helps you clearly discover God’s specific purpose for your life, and transforms you to fulfil all God wants you to.",
      "As valuable as it is, you can access this school for free if you enrol today. Take advantage of this offer while it lasts; logistical costs may apply in the future.",
      "You are also welcome to support and partner with our vision to see every person saved, established, and fulfilling God’s purpose. You will be able to access the partnership section after enrolment.",
    ],
  },
  tools: {
    title: "Tools and platforms you will use",
    items: [
      {
        title: "Telegram",
        description:
          "Receive cohort announcements, reminders, and important updates in the SOGP Telegram channel.",
        iconSrc: "/site/home/assets/social-media-icons/telegram-icon.svg",
      },
      {
        title: "Pleros Dashboard",
        description:
          "Access daily tracks, assessments, formation progress, and certificate readiness in one place.",
        imageSrc:
          "/site/home/assets/dashboard-cards/6-school-of-purpose-v2.webp",
      },
    ],
  },
  facilitator: {
    title: "Lead Facilitator",
    name: aboutPageMinisterFollow.name,
    imageSrc: "/assets/home/pastor.jpg",
    description:
      "Akinwunmi Akinbile is the leader of Pleros Ministries and Missions and the pastor of Fullness of Christ Church. His passion and mission are to reach all people by all means with the Gospel—leading them into salvation, establishment, and the fulfilment of God’s purpose.",
  },
  socialProof: {
    title: "Join an ever-increasing number of changed lives",
    description:
      "By joining SOGP, you become part of an ever-increasing number of people whose lives have been radically changed by encountering the Word of Truth, discovering God’s purpose, and living transformed lives in pursuit of His will.",
    imageSrc: "/site/home/assets/pleros-community-background-v2.webp",
  },
  benefits: {
    title: "More reasons and benefits to join",
    items: [
      "Flexibility: Learn within a guided rhythm and catch up when needed",
      "Accessibility: Participate from anywhere in the world",
      "Confidentiality: Stay private throughout the process",
      "Community: Grow through doctrinal dialogue, prayer, and fellowship",
      "Communication: Receive simple, direct guidance throughout the cohort",
      "Accountability: Choose a partner to support your progress and growth in the faith",
    ],
  },
  faqs: [
    {
      question: "What does SOGP cost?",
      answer: "Currently completely free.",
    },
    {
      question: "Can I join if I attend another church?",
      answer: "Yes. No church-membership change required.",
    },
    {
      question: "Who can enrol?",
      answer:
        "Anyone seeking truth, purpose, spiritual growth, or answers about Christianity.",
    },
    {
      question: "How long does it take?",
      answer:
        "Four-week guided cohort: weekday tracks and weekend live classes.",
    },
    {
      question: "Is it self-paced?",
      answer:
        "Guided schedule, with flexibility to catch up and finish outstanding work.",
    },
    {
      question: "What do I need?",
      answer:
        "Internet-enabled smartphone or laptop, Telegram, and Pleros Dashboard access.",
    },
    {
      question: "How do I earn certification?",
      answer:
        "You earn a certificate if you meet the demands which you’re going to see in the orientation pack.",
    },
  ],
} as const;

const sogpCurriculumLevelLabels = SOGP_LEVELS.map(
  (level) => `Level ${level.level}`,
);

export function getSogpCurriculumLevels() {
  return sogpCurriculumLevelLabels.map((label, levelIndex) => ({
    value: `level-${levelIndex + 1}`,
    label,
    description: sogpLandingContent.curriculum.levels[label],
    tracks: sogpLandingContent.curriculum.tracks.flatMap((track, index) =>
      track.level === label ? [{ ...track, number: index + 1 }] : [],
    ),
  }));
}
