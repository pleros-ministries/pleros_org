import { expect, test } from "vitest";

import { sogpLandingContent } from "./landing-content";

test("provides the approved basic SOGP enrolment FAQs", () => {
  expect(sogpLandingContent.faqs).toEqual([
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
        "SOGP was originally designed to take four weeks, but you can complete it at your own pace, with no pressure.",
    },
    {
      question: "Is it self-paced?",
      answer:
        "Yes. SOGP is flexible and self-paced, so you can catch up and complete any outstanding work with the help you need along the way.",
    },
    {
      question: "What do I need?",
      answer:
        "Internet-enabled smartphone or laptop, Telegram, and Pleros Dashboard access.",
    },
    {
      question: "How do I earn a certificate?",
      answer:
        "You earn a certificate by meeting the demands of SOGP. These will be explained during your orientation message.",
    },
  ]);
});
