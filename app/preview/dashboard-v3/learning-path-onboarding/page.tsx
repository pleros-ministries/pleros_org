import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRightIcon, ChevronRightIcon, PlayIcon } from "lucide-react";

import groupStyles from "@/components/community/discipleship/discipleship-group.module.css";
import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import hub from "@/components/sogp/learning/learning-hub.module.css";

import { BuilderMock } from "./builder";
import { ChooserMock } from "./chooser";
import mock from "./mock.module.css";
import { longDate, podcastRoad, shortDate, addDays, sogpRoad } from "./sample";

export const metadata = { title: "Learning path onboarding preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/**
 * Mockup, round 2 (user, 24 November; Pastor's recording, 18 November): three
 * learning paths, each showing where it leads and when you'd finish; a podcast
 * plan you can take or build; Learning without Other learning. Sample data only.
 */
const SCREENS = {
  home: "1 Home",
  learning: "2 Learning",
  choose: "3 Choose",
  build: "4 Podcast plan",
  "done-sogp": "5 SOGP",
  "done-podcast": "5 Podcast",
  "done-own": "5 Own journey",
  left: "Left halfway",
} as const;
type Screen = keyof typeof SCREENS;

const NOTES: Record<Screen, string[]> = {
  home: ["The card asks you to choose a learning path. Your SOGP days stay hidden until you have one."],
  learning: ["Learning asks for a path first. Other learning is gone.", "The card’s line is narrower on phones so it stays clear of the lit doorway."],
  choose: ["Three paths, each in its own colour and art: SOGP, Podcast, Your own journey.", "The chosen card opens to show where it leads and when you’d finish (the Pastor’s “target set before me”).", "SOGP asks where you’re starting. Podcast asks for a pace with two tiles you can see are choices.", "The path is saved when you continue."],
  build: ["Two ways in: the suggested plan in one tap, or Build my own from whole series or single episodes, with a running count.", "Review shows the plan day by day; move any episode up or down."],
  "done-sogp": ["Every path ends here, on Learning, with today’s step on the card and Your road under it."],
  "done-podcast": ["Your road shows the podcast plan, then SOGP from level 1, as the Pastor described."],
  "done-own": ["Your own journey asks for teachings next; the card says so until you’ve picked them."],
  left: ["Someone who chose Podcast and left keeps the path. The card says “Finish building your plan”, so it can’t be mistaken for listening."],
};

const BLUE = { "--hub-art": `url("/assets/dashboard/learning-card/my-learning-background-v5.webp")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/my-learning-background-v5-wide.webp")`, "--hub-field": "#2056d6", "--hub-ink": "#2056d6" } as CSSProperties;

function Card({ top, pace, title, line, action, href, play }: { top: string; pace?: string; title: string; line: string; action: string; href: string; play?: boolean }) {
  return <section className={hub.card} style={BLUE}>
    <div className={hub.cardTop}><span>{top}</span>{pace ? <span className={hub.pace}>{pace}</span> : null}</div>
    <div><h2>{title}</h2><span className={`${hub.cardMeta} ${mock.narrowMeta}`}>{line}</span></div>
    <Link href={href} className={hub.resume}>{action}{play ? <PlayIcon className="size-4" fill="currentColor" strokeWidth={0} /> : <ArrowRightIcon className="size-4" strokeWidth={2.2} />}</Link>
  </section>;
}

function RoadPanel({ title, rows, foot }: { title: string; rows: { label: string; title: string; when: string }[]; foot?: ReactNode }) {
  return <>
    <div className={hub.sectionTitle}><h2>{title}</h2><Link href="?screen=choose" className="inline-flex items-center gap-0.5">Change path<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link></div>
    <div className={mock.roadPanel}>
      <ol className={mock.road}>{rows.map((row, index) => <li key={row.label + row.title} data-state={index === 0 ? "now" : "later"}><span><b>{row.label}</b> · {row.title}</span><span className={mock.when}>{row.when}</span></li>)}</ol>
      {foot ? <p className={mock.lede}>{foot}</p> : null}
    </div>
  </>;
}

function Learning({ sub, children }: { sub: string; children: ReactNode }) {
  return <div className={hub.page}><div className={hub.column}>
    <div><h1>Learning</h1><p className={groupStyles.sub}>{sub}</p></div>
    {children}
  </div></div>;
}

const strong = (text: string) => <b style={{ fontWeight: 500, color: "var(--color-text-strong)" }}>{text}</b>;

export default async function LearningPathOnboardingPreview({ searchParams }: { searchParams: Promise<{ screen?: string; pace?: string }> }) {
  const query = await searchParams;
  const screen: Screen = query.screen && query.screen in SCREENS ? query.screen as Screen : "home";
  const pace = query.pace === "one" ? 1 : 2;
  const sogp = sogpRoad(1), podcast = podcastRoad(2);

  const view = screen === "home" ? <div className={hub.page}><div className={hub.column}>
      <h1>Good morning, Sam</h1>
      <Card top="SOGP November 2026" title="Make room to grow" line="Pick a path and see where it takes you" action="Choose a learning path" href="?screen=choose" />
    </div></div>
    : screen === "learning" ? <Learning sub="SOGP November 2026">
      <Card top="SOGP November 2026" title="Choose a learning path" line="SOGP, podcasts, or your own journey" action="Choose a path" href="?screen=choose" />
    </Learning>
    : screen === "choose" ? <ChooserMock />
    : screen === "build" ? <BuilderMock pace={pace} />
    : screen === "done-sogp" ? <Learning sub="SOGP · 1 hr a day">
      <Card top="Level 1 · Day 1" pace="1 hr a day" title="Gospel: The Word of Truth" line="Teaching, quiz and written response" action="Start today’s teaching" href="#" play />
      <RoadPanel title="Your road" rows={sogp.rows} foot={<>Level 4 done by {strong(longDate(sogp.finish))} if you keep a teaching a day.</>} />
    </Learning>
    : screen === "done-podcast" ? <Learning sub="Podcast · 30 min a day">
      <Card top="Day 1 of 30" pace="30 min a day" title="The Reality of God’s Purpose" line="Parts 1 and 2 · about 30 min" action="Listen to day 1" href="#" play />
      <RoadPanel title="Your road" rows={podcast.rows} foot={<>Plan done by {strong(longDate(podcast.finish))}.</>} />
    </Learning>
    : screen === "done-own" ? <Learning sub="Your own journey">
      <Card top="Your own journey" title="Choose your teachings" line="A whole series or single teachings, one a day" action="Choose teachings" href="#" />
      <RoadPanel title="Your road" rows={[{ label: "Next", title: "Choose your teachings", when: "Today" }, { label: "Then", title: "One a day, in your order", when: `From ${shortDate(addDays(1))}` }]} />
    </Learning>
    : <Learning sub="Podcast · 30 min a day">
      <Card top="Podcast · 30 min a day" title="Finish building your plan" line="Your path is saved. Pick your 60 episodes, or take ours" action="Build my plan" href="?screen=build&pace=two" />
      <RoadPanel title="Your road" rows={[{ label: "Next", title: "Build your 30-day plan", when: "Today" }, ...podcast.rows.slice(1)]} />
    </Learning>;

  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <div className="mx-auto grid max-w-[640px] gap-2 px-4 pt-3 text-xs text-(--color-text-muted)">
      <span>Preview · learning path onboarding, round 2 · sample data · nothing saved</span>
      <span className="flex flex-wrap gap-x-3 gap-y-1">{(Object.keys(SCREENS) as Screen[]).map(key => <Link key={key} href={`?screen=${key}${key === "build" ? `&pace=${pace === 1 ? "one" : "two"}` : ""}`} className={key === screen ? "font-medium text-(--color-community-ink)" : "underline"}>{SCREENS[key]}</Link>)}</span>
      <ul className="grid gap-1 rounded-[10px] bg-white p-3 text-[12.5px] leading-[18px] text-(--color-text-strong) shadow-[inset_0_0_0_1px_var(--dashboard-panel-edge,#e2e5ea)]">
        {NOTES[screen].map(note => <li key={note} className="flex gap-2"><span aria-hidden="true" className="mt-[7px] size-1 shrink-0 rounded-full bg-[#2056d6]" />{note}</li>)}
      </ul>
    </div>
    {view}
  </div>;
}
