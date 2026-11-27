import type { LearningHubData } from "@/lib/dashboard/learning-hub";
import type { CertificationFacts } from "@/lib/db/queries/sogp-certification-facts";

/** Sample data for the Learning and SOGP page previews: fake progress only, no real people. */
export const SAMPLE_HUB: LearningHubData = {
  path: "traditional",
  paceLabel: "1 hr/day · Traditional",
  state: "active",
  cohortTitle: "SOGP October 2026",
  weekLabel: "Week 2 of 4",
  card: { eyebrow: "Level 2", title: "Biblical Origin and Ontology", progress: "Track 10 of 24 · 9 done", done: 9, total: 24, href: "#", action: "Resume track 10", level: 2 },
  catchUp: null,
  review: { title: "Week 2 review", when: "Sunday 25 October" },
  certificate: { available: false },
  discipler: { firstName: "Tolu" },
  doneCount: 9,
  levels: [
    { level: 1, title: "Gospel foundations and the Spirit", done: 6, total: 6, state: "done", opens: null },
    { level: 2, title: "Doctrinal foundations", done: 3, total: 6, state: "now", opens: null },
    { level: 3, title: "Redemption and the new creation", done: 0, total: 6, state: "later", opens: "Mon 26 Oct" },
    { level: 4, title: "Practical walk and assignment", done: 0, total: 6, state: "later", opens: "Mon 2 Nov" },
  ],
  advancedInterest: false,
  next: { canChoose: false, finished: false, card: null },
  summary: {
    counts: [{ label: "Tracks", value: "18" }, { label: "Levels", value: "3" }, { label: "Done by", value: "14 Dec" }],
    listTitle: "Levels",
    rows: [
      { title: "Level 1", meta: "6 tracks · 24–29 Nov", end: "Done", href: "#", muted: false },
      { title: "Level 2", meta: "6 tracks · 1–6 Dec", end: "3 of 6", href: "#", muted: false },
      { title: "Level 3", meta: "6 tracks · 8–13 Dec", end: null, href: "#", muted: false },
      { title: "Level 4", meta: "6 tracks · Coming soon", end: null, href: null, muted: true },
      { title: "Advanced SOGP", meta: "After level 4", end: null, href: null, muted: true },
    ],
    more: null, note: "A track a day, with a group review at the end of each level.", empty: null,
  },
  journey: { welcomePackDone: true, preSogp: { done: 10, total: 10 }, month: "December", prayerToday: true },
};

export const SAMPLE_FACTS: CertificationFacts = {
  pathLabel: "Traditional path", podcast: false, learningDone: 9, learningTotal: 24, learningPass: false,
  learningLabel: "Required assessments complete", resumeHref: "#",
  reviews: { attended: 1, missed: 0, madeUp: 0, outstandingMakeups: 0, owed: 1, outstanding: 0, reviewPass: true },
  prayer: { present: 6, total: 9, percent: 64, required: 80, pass: false },
  meetsRequirements: false, certificateAvailable: false,
};
