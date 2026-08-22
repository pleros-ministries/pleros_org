import { expect, test } from "vitest";

import { aboutPageMinisterFollow } from "../about-page-content";
import { sogpLandingContent } from "./landing-content";

test("preserves the authoritative SOGP landing copy while correcting obvious errors", () => {
  expect(sogpLandingContent.hero.title).toBe(
    "Find Truth, Discover God’s Purpose, Grow to fulfill it with SOGP",
  );
  expect(sogpLandingContent.hero.description).toBe(
    "Get answers to difficult questions about God, gain clarity on God’s purpose for your life, and receive the transformation and empowerment needed to fulfill it.",
  );
  expect(sogpLandingContent.outcomes).toEqual([
    "Get Clarity on Difficult Questions about God, His truth and His Word",
    "Discover God’s Purpose for Your Life",
    "Be transformed and strengthened to walk in God’s will",
    "Learn how to receive and minister healing and the supernatural",
    "Be empowered to pursue and fulfill God’s purpose for your life",
  ]);
  expect(sogpLandingContent.definition).toEqual({
    title: "What is SOGP",
    description:
      "The School of God’s Purpose is the single platform that provides answers to life’s most foundational questions, provides edification to radically transform you whilst empowering and stirring you to fulfill God’s purpose for your life.",
  });
  expect(sogpLandingContent.audiences).toEqual([
    "a. Those in unbelief or doubt about God’s existence or the Christian faith but seeking answers to those questions.",
    "b. Those with questions and doubts about God’s purpose for their lives",
    "c. Those desiring spiritual growth and transformation especially in character—such as changing habits or breaking difficult addictions",
    "d. Those desiring to receive and minister divine healing for themselves and others",
    "e. Those desiring empowerment to walk and function in the supernatural",
    "f. Those desiring to understand God’s wisdom on their natural pursuits (career, business, etc.) and their finances",
    "g. Anyone who wants a stronger walk with God and hungers to fulfill His purpose.",
  ]);
  expect(sogpLandingContent.curriculum).toEqual({
    title: "Curriculum of SOGP",
    description:
      "The SOGP curriculum is designed to cover the foundational scope of",
  });
  expect(sogpLandingContent.structure).toEqual({
    title: "The Structure of SOGP",
    description:
      "The School of God’s Purpose has a fixed structure that is designed to accommodate the flexible demands of all kinds and classes of people - students, working class, retired. Whether you are a freelancer, 9-5er or a busy entrepreneur, this structure was made with you in mind.",
  });
  expect(sogpLandingContent.enrollment).toEqual({
    title: "Enrollment Requirement",
    description:
      "As of today, SOGP is being offered FREE to all participants. All you need is readiness, availability to listen, learn and participate through the period of the school. With a smartphone and a laptop at your disposal for one month you can begin and complete the School of God’s Purpose",
  });
  expect(sogpLandingContent.tools).toEqual({
    title: "Tools and Platforms needed to engage:",
    items: [
      "We use Telegram for the group and community.",
      "We use the Pleros Dashboard for the course materials.",
    ],
  });
  expect(sogpLandingContent.benefits).toEqual({
    title: "Other Reasons and Benefits to Join",
    items: [
      "Flexibility: Self-paced",
      "Accessibility: Worldwide",
      "Confidentiality: You can stay private throughout the entire process",
      "Community: You can enjoy the benefits of a community in doctrinal dialogue and debates, prayer and fellowship",
      "Easy and simple communication",
      "Accountability: You can choose to have a direct accountability partner to help your progress and growth in the faith",
    ],
  });
});

test("uses the About page lead minister profile for the SOGP lead facilitator", () => {
  expect(sogpLandingContent.facilitator).toEqual({
    title: "Lead Facilitator",
    name: aboutPageMinisterFollow.name,
    handle: aboutPageMinisterFollow.handle,
    imageSrc: "/assets/home/pastor.jpg",
    links: aboutPageMinisterFollow.links,
  });
});
