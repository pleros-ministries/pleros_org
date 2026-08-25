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
        "Complete required tracks and assessments, daily podcast logging, and at least 80% Morning Prayer Watch attendance.",
    },
  ]);
});
