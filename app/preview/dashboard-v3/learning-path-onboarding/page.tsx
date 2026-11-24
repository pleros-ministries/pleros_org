import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { DashboardHomeView } from "@/components/dashboard/v3/home-view";
import { LearningHub } from "@/components/sogp/learning/learning-hub";
import learn from "@/components/sogp/learning/learning.module.css";
import type { LearningHubData } from "@/lib/dashboard/learning-hub";
import type { DashboardHomeData } from "@/lib/dashboard/home";
import type { LearningViewData } from "@/lib/sogp/learning-view";

import { SAMPLE_HUB } from "../learning-slim/sample";
import { ChooserMock } from "./chooser";

export const metadata = { title: "Learning path onboarding preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/**
 * Mockup of the corrected learning-path onboarding for a new enrolee, from the
 * 17 November walkthrough's seven fixes. Sample data only; nothing saves.
 */
const SCREENS = {
  home: "1 Home",
  learning: "2 Learning",
  choose: "3 Choose",
  tracklist: "4 Tracklist",
  ready: "5 Ready",
  "done-podcast": "6 Day 1 · Podcast",
  "done-traditional": "6 Day 1 · Traditional",
  left: "Left halfway",
} as const;
type Screen = keyof typeof SCREENS;

/** What each screen changes, in the walkthrough's numbering. */
const NOTES: Record<Screen, string[]> = {
  home: ["Your SOGP days stay hidden until a path is chosen, so a new enrolee isn’t told they have days to catch up (fix 2).", "Start SOGP opens the chooser, as today."],
  learning: ["Learning asks for a path first, before it looks at the cohort, so a new enrolee no longer sees “Resume track 1 · Traditional” (fix 1)."],
  choose: ["Both paths say how they count toward the certificate (fix 3).", "Tapping Podcast asks for a pace; nothing is picked for you (fix 4).", "Continue saves the path on both, so leaving afterwards keeps the choice (fix 6).", "Traditional’s extra confirm screen goes: the card already says what the path is, and its second button wrongly said “Choose another pace”."],
  tracklist: ["One screen instead of two: the plan preview and “Make it your tracklist” are merged, and the counter reads 1 of 2, then 2 of 2 (fix 5).", "The path is already saved, so this only shapes the episodes."],
  ready: ["“Start my plan” saves the tracklist and goes to Learning, the same place Traditional ends (fix 7)."],
  "done-podcast": ["Both paths end here, on Learning, with day 1 ready on the card (fix 7). The player opens from the card."],
  "done-traditional": ["Both paths end here, on Learning, with track 1 ready on the card (fix 7)."],
  left: ["Someone who chose Podcast and left before finishing their tracklist keeps the path; Learning picks up where they stopped (fix 6)."],
};

const COHORT = { cohortTitle: "SOGP November 2026", weekLabel: null, catchUp: null, doneCount: 0, review: null, certificate: { available: false },
  journey: { welcomePackDone: false, preSogp: { done: 0, total: 10 }, days: { current: 1, total: 28, teaching: 24, reviews: 4 }, prayerToday: false } };
const NO_PATH: LearningHubData = { ...SAMPLE_HUB, ...COHORT, state: "start", card: { ...SAMPLE_HUB.card, level: 1 } };
const DAY_ONE_TRADITIONAL: LearningHubData = { ...SAMPLE_HUB, ...COHORT, state: "active", weekLabel: "Week 1 of 4",
  card: { eyebrow: "Level 1 · Gospel foundations", title: "Gospel: The Word of Truth", progress: "Track 1 of 24 · ready to start", done: 0, total: 24, href: "#", action: "Start track 1", level: 1 } };
const DAY_ONE_PODCAST: LearningHubData = { ...DAY_ONE_TRADITIONAL, path: "podcast_two", paceLabel: "30 min/day · Podcast",
  card: { eyebrow: "Day 1 of 30", title: "The Reality of God’s Purpose (Part 1)", progress: "0 of 60 episodes · 2 today", done: 0, total: 60, href: "#", action: "Listen to day 1", level: 1 } };
const LEFT_HALFWAY: LearningHubData = { ...DAY_ONE_PODCAST, weekLabel: null,
  card: { eyebrow: "SOGP November 2026", title: "Finish your tracklist", progress: "Your path is saved. Choose your 30 days of episodes next.", done: 0, total: 0, href: "?screen=tracklist&pace=two", action: "Finish my tracklist", level: 1 } };

const SERIES = [
  { title: "The Reality of God’s Purpose", parts: "Parts 1–6" },
  { title: "The Pursuit of God’s Purpose", parts: "Parts 1–6" },
  { title: "How to Fulfil God’s Purpose", parts: "Parts 1–8" },
];
const REST = [["The Place of the Gospel in Your Life", 10], ["Walk of Faith", 12], ["Kingdom Living", 10], ["Hearing God", 8]] as const;

function Tracklist({ pace }: { pace: 1 | 2 }) {
  const slots = pace * 30;
  let day = 1;
  const groups = SERIES.map(series => { const count = Number(series.parts.split("–")[1]); const first = day; day += Math.ceil(count / pace); return { ...series, days: `Days ${first}–${day - 1}` }; });
  return <section className={learn.page}>
    <header className={learn.header}><p className={learn.eyebrow}>Your 30-day plan · 1 of 2</p><h1>Your podcast tracklist</h1><p className={learn.muted}>We’ve filled it with a suggested start. Keep it, or swap and reorder episodes</p></header>
    <div className={learn.readyLine}><DashboardIcon name="circlecheck" /><span><strong>Podcast · {pace === 2 ? "30" : "15"} min/day is saved</strong><span className={learn.meta}>{pace === 2 ? "Two episodes" : "One episode"} each day. You can change the pace later.</span></span></div>
    <div className={learn.stack}>
      <div className={learn.metaRow}><h2>Suggested plan</h2><span className={learn.accent}>{slots}/{slots} episodes</span></div>
      <ol className={learn.seriesCard}>{groups.map((group, index) => <li key={group.title}><span className={learn.trackNumber}>{String(index + 1).padStart(2, "0")}</span><span><strong>{group.title}</strong><span className={learn.meta}>{group.parts} · {group.days}</span></span></li>)}</ol>
    </div>
    <div className={learn.stack}><h2>Then continue with</h2><ul className={learn.plainList}>{REST.map(([title, count]) => <li key={title}><span>{title}</span><span className={learn.meta}>{count} episodes</span></li>)}</ul></div>
    <Link href="#" className={learn.rowButton}><DashboardIcon name="edit" /><span>Swap or reorder episodes</span><DashboardIcon name="right" size={16} /></Link>
    <div className={learn.footer}><p className={`${learn.meta} ${learn.centre}`}>30 days · {slots} episodes</p><Link href={`?screen=ready&pace=${pace === 2 ? "two" : "one"}`} className={learn.primary}>Use this plan<DashboardIcon name="arrow" /></Link></div>
  </section>;
}

function Ready({ pace }: { pace: 1 | 2 }) {
  const first = pace === 2 ? [["The Reality of God’s Purpose (Part 1)", "15:33"], ["The Reality of God’s Purpose (Part 2)", "14:13"]] : [["The Reality of God’s Purpose (Part 1)", "15:33"]];
  return <section className={learn.page}>
    <header className={learn.header}><p className={learn.eyebrow}>Your 30-day plan · 2 of 2</p><h1>Your next 30 days, ready</h1><p className={learn.muted}>Your chosen episodes, in your own order</p></header>
    <div className={learn.summaryCard}><span className={learn.eyebrow}>Your daily aim</span><strong>{pace === 2 ? "30" : "15"} min/day</strong><span className={learn.meta}>{pace === 2 ? "2 podcast episodes" : "1 podcast episode"} each day</span></div>
    <div className={learn.stack}>
      <div className={learn.metaRow}><h2>Day 1</h2><span className={learn.meta}>{first.length} {first.length === 1 ? "episode" : "episodes"}</span></div>
      <ol className={learn.seriesCard}>{first.map(([title, duration], index) => <li key={title}><span className={learn.trackNumber}>{String(index + 1).padStart(2, "0")}</span><span><strong>{title}</strong><span className={learn.meta}>Podcast · {duration}</span></span></li>)}</ol>
    </div>
    <Link href={`?screen=tracklist&pace=${pace === 2 ? "two" : "one"}`} className={learn.rowButton}><DashboardIcon name="edit" /><span>Swap or reorder episodes</span><DashboardIcon name="right" size={16} /></Link>
    <p className={learn.readyNote}><DashboardIcon name="clock" size={16} /><span>Missed days wait for you. Nothing skips ahead by date.</span></p>
    <div className={learn.footer}><p className={`${learn.meta} ${learn.centre}`}>Day 1 waits for you on Learning</p><Link href="?screen=done-podcast" className={learn.primary}>Start my plan<DashboardIcon name="check" /></Link></div>
  </section>;
}

const HOME_NO_PATH: DashboardHomeData = {
  day: "2026-11-24", reports: [
    { category: "devotional", title: "Devotional", description: "No report submitted", status: "Not reported", tone: "neutral" },
    { category: "ministry", title: "Ministry", description: "No report submitted", status: "Not reported", tone: "neutral" },
    { category: "meetings", title: "Meetings", description: "No report submitted", status: "Not reported", tone: "neutral" },
  ], card: { kind: "start", href: "?screen=choose" }, sogp: null,
  learning: { title: "", href: "#", action: "", completed: 0, total: 0, enrolled: false },
};

export default async function LearningPathOnboardingPreview({ searchParams }: { searchParams: Promise<{ screen?: string; pace?: string }> }) {
  const query = await searchParams;
  const screen: Screen = query.screen && query.screen in SCREENS ? query.screen as Screen : "home";
  const pace = query.pace === "one" ? 1 : 2;
  const learning = { followUp: null } as unknown as LearningViewData;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <div className="mx-auto grid max-w-[640px] gap-2 px-4 pt-3 text-xs text-(--color-text-muted)">
      <span>Preview · learning path onboarding · sample data · nothing saved</span>
      <span className="flex flex-wrap gap-x-3 gap-y-1">{(Object.keys(SCREENS) as Screen[]).map(key => <Link key={key} href={`?screen=${key}`} className={key === screen ? "font-medium text-(--color-community-ink)" : "underline"}>{SCREENS[key]}</Link>)}</span>
      <ul className="grid gap-1 rounded-[10px] bg-white p-3 text-[12.5px] leading-[18px] text-(--color-text-strong) shadow-[inset_0_0_0_1px_var(--dashboard-panel-edge,#e2e5ea)]">
        {NOTES[screen].map(note => <li key={note} className="flex gap-2"><span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-[#2056d6]" />{note}</li>)}
      </ul>
    </div>
    {screen === "home" ? <DashboardHomeView name="Sam" greeting="Good morning" data={HOME_NO_PATH} />
      : screen === "learning" ? <LearningHub hub={NO_PATH} learning={learning} />
      : screen === "choose" ? <ChooserMock />
      : screen === "tracklist" ? <Tracklist pace={pace} />
      : screen === "ready" ? <Ready pace={pace} />
      : screen === "done-podcast" ? <LearningHub hub={DAY_ONE_PODCAST} learning={learning} />
      : screen === "done-traditional" ? <LearningHub hub={DAY_ONE_TRADITIONAL} learning={learning} />
      : <LearningHub hub={LEFT_HALFWAY} learning={learning} />}
  </div>;
}
