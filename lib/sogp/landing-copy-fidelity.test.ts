import { expect, test } from "vitest";

import { aboutPageMinisterFollow } from "../about-page-content";
import { sogpLandingContent } from "./landing-content";

test("uses the approved conversion-focused SOGP hero and reader questions", () => {
  expect(sogpLandingContent.hero.titleLines).toEqual([
    "Find Truth,",
    "Discover God’s Purpose,",
    "Grow to fulfil it,",
    "with the School of God’s Purpose",
  ]);
  expect(sogpLandingContent.hero.description).toBe(
    "Get answers to difficult questions about God, gain clarity on God’s purpose for your life, and receive the transformation and empowerment needed to fulfil it.",
  );
  expect(sogpLandingContent.questionsTitle).toBe("What are you seeking?");
  expect(sogpLandingContent.questions).toEqual([
    "Do you have doubts about your faith, beliefs, or religious worldview?",
    "Do you wonder what exactly your purpose in life is?",
    "Do you struggle to grow spiritually and break free from habits and addictions?",
    "Do you desire to function in the healing power and the supernatural?",
    "Do you want to walk more in the strength and power of the Spirit to fulfil God’s purpose for you?",
  ]);
  expect(sogpLandingContent.outcomes).toEqual([
    "Gain clarity on difficult questions about God, His truth, and His Word",
    "Discover God’s purpose for your life",
    "Be transformed and strengthened to walk in God’s will",
    "Learn how to receive and minister healing and the supernatural",
    "Be empowered to pursue and fulfil God’s purpose for your life",
  ]);
  expect(sogpLandingContent.definition.outcomesIntro).toBe(
    "With SOGP, you will:",
  );
  expect(sogpLandingContent.definition.description).toBe(
    "The School of God’s Purpose is a platform that provides you with answers to the most important questions of life in a simple, clear, well-structured and flexible manner. The goal is to give you persuasion and clarity about the truth of existence, help you discover and recognise God’s purpose for your life, and cause you to live a transformed and empowered life that fulfils God’s assignments.",
  );
  expect(sogpLandingContent.audiences[4]).toBe(
    "Those desiring empowerment to do the work of ministry and to function in the supernatural.",
  );
  expect(sogpLandingContent.ctas).toEqual({
    hero: "Enrol to get started",
    early: "Begin your enrolment",
    middle: "Start your journey",
    curriculum: "Enrol to start learning",
    free: "Enrol for free",
  });
});

test("uses the approved curriculum, structure, and enrollment copy", () => {
  expect(sogpLandingContent.curriculum.description).toBe(
    "The curriculum of SOGP is paced to answer foundational questions, strengthen your overall doctrinal persuasion, and stir you into a practical walk with God and in His purpose.",
  );
  expect(sogpLandingContent.curriculum.tracks[4]).toEqual({
    level: "Level 1",
    title: "Discipline – The Foundation of the Pursuit of Purpose",
  });
  expect(
    sogpLandingContent.curriculum.tracks.filter(
      (track) => track.level === "Level 3",
    ),
  ).toEqual([
    { level: "Level 3", title: "Baptism of the Holy Ghost" },
    { level: "Level 3", title: "The Walk of Faith" },
    { level: "Level 3", title: "The Life of Prayer" },
    { level: "Level 3", title: "Believer’s Authority" },
    { level: "Level 3", title: "Healing in the Newness of Life" },
    {
      level: "Level 3",
      title: "Natural Assignment in the Newness of Life",
    },
    {
      level: "Level 3",
      title: "Spiritual Assignment in the Newness of Life",
    },
    { level: "Level 3", title: "Supernatural in the Newness of Life" },
  ]);
  expect(sogpLandingContent.structure.schedule).toEqual([
    {
      label: "Weekdays",
      meta: "Monday–Friday",
      detail: "One guided track each day on the Pleros Dashboard",
    },
    {
      label: "Weekends",
      meta: "Saturday–Sunday",
      detail: "Live classes and cohort engagement",
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
  ]);
  expect(sogpLandingContent.enrollment.paragraphs).toEqual([
    "The School of God’s Purpose is an extremely valuable platform that enlightens you about the truth of existence, helps you clearly discover God’s specific purpose for your life, and transforms you to fulfil all God wants you to.",
    "As valuable as it is, you can access this school for free if you enrol today. Take advantage of this offer while it lasts; logistical costs may apply in the future.",
    "You are also welcome to support and partner with our vision to see every person saved, established, and fulfilling God’s purpose. You will be able to access the partnership section after enrolment.",
  ]);
});

test("uses approved tools, facilitator, and social-proof messaging", () => {
  expect(sogpLandingContent.tools.items).toEqual([
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
      imageSrc: "/site/home/assets/dashboard-cards/6-school-of-purpose-v2.webp",
    },
  ]);
  expect(sogpLandingContent.facilitator).toEqual({
    title: "Lead Facilitator",
    name: aboutPageMinisterFollow.name,
    imageSrc: "/assets/home/pastor.jpg",
    description:
      "Akinwunmi Akinbile is the leader of Pleros Ministries and Missions and the pastor of Fullness of Christ Church. His passion and mission are to reach all people by all means with the Gospel—leading them into salvation, establishment, and the fulfilment of God’s purpose.",
  });
  expect(sogpLandingContent.socialProof).toEqual({
    title: "Join an ever-increasing number of changed lives",
    description:
      "By joining SOGP, you become part of an ever-increasing number of people whose lives have been radically changed by encountering the Word of Truth, discovering God’s purpose, and living transformed lives in pursuit of His will.",
    imageSrc: "/site/home/assets/pleros-community-background-v2.webp",
  });
});
