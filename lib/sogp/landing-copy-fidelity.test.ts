import { expect, test } from "vitest";

import { sogpLandingContent } from "./landing-content";

test("adopts authoritative SOGP landing copy verbatim", () => {
  expect(sogpLandingContent.hero.title).toBe(
    "Find Truth, Discover God’s Purpose, Grow to fulfill it with SOGP",
  );
  expect(sogpLandingContent.hero.description).toBe(
    "Get answers to difficult questions about God, clarity on God’s purpose for your life and receive the transformation and empowerment needed to fulfill it.",
  );
  expect(sogpLandingContent.outcomes).toEqual([
    "Get Clarity on Difficult Questions about God, His truth and His Word",
    "Discover God’s Purpose for Your Life",
    "Be transformed strengthened to walk in God’s will",
    "Learn how to receive and minister healing and the supernatural",
    "Be empowered to pursue and fulfill God’s purpose for your life",
  ]);
  expect(sogpLandingContent.definition).toEqual({
    title: "What is SOGP",
    description:
      "The School of God’s Purpose is the single platform that provides answers to life’s most foundational questions, provides edification to radically transform you whilst empowering and stirring you fulfill God’s purpose for your life.",
  });
  expect(sogpLandingContent.audiences).toEqual([
    "a. Those in unbelief or doubt about God’s existence or the Christian faith but seeking answers to those questions.",
    "b. Those with questions and doubts about God’s purpose for their lives",
    "c.Those desiring spiritual growth and transformation especially in character - such as change in habits or to break difficult addictions",
    "d. Those desiring to receive and minister divine healing for themselves and others",
    "e. Those desiring empowerment to walk and function in the supernatural",
    "f. Those desiring to understand God’s wisdom on their natural pursuits ( career, business etc) and their finances",
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
      "We use Telegram for the group and community",
      "We use the Pleros Dashboard for the Course Materials",
    ],
  });
  expect(sogpLandingContent.benefits).toEqual({
    title: "Other Reason and Benefits to Join",
    items: [
      "Flexibility: Self Paced",
      "Accessibility: Worldwide”",
      "Confidentiality: You can stay private through the entire process",
      "Community: You can enjoy the benefits of a community in doctrinal dialogue and debates, prayer and fellowship",
      "Easy and Simple Communication",
      "Accountability: You can choose to have a direct accountability partner to help your progress and growth in the faith",
    ],
  });
});
