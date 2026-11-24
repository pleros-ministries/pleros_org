import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRightIcon, ChevronRightIcon, PlayIcon } from "lucide-react";

import groupStyles from "@/components/community/discipleship/discipleship-group.module.css";
import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import hub from "@/components/sogp/learning/learning-hub.module.css";

import { getAllTeachings } from "@/lib/db/queries/teachings";

import { BuilderMock } from "./builder";
import { JourneyMock, type LibrarySeries } from "./journey";
import { ChooserMock } from "./chooser";
import mock from "./mock.module.css";
import { SOGP_LEVELS } from "@/lib/sogp/curriculum";

import { EPISODES, addDays, podcastRoad, shortDate, sogpLevels, suggestedPlan } from "./sample";

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
  journey: "4 Doctrinal journey",
  "done-sogp": "5 SOGP",
  "done-podcast": "5 Podcast",
  "done-own": "5 Journey",
  left: "Left halfway",
} as const;
type Screen = keyof typeof SCREENS;

const NOTES: Record<Screen, string[]> = {
  home: ["The card asks you to choose a learning path. Your SOGP days stay hidden until you have one."],
  learning: ["Learning asks for a path first. Other learning is gone.", "The card’s line is narrower on phones so it stays clear of the lit doorway."],
  choose: ["Three paths, each in its own colour and art: SOGP, Podcast, Choose doctrinal journey. SOGP runs levels 1–3, then Advanced SOGP; level 4 isn’t taught yet.", "Choosing a card opens a panel under it (not inside it) showing where the path leads and when you’d finish (the Pastor’s “target set before me”).", "SOGP asks where you’re starting, then shows each level’s tracks and dates; tap a level to see its tracks. Podcast asks for a pace with two tiles you can see are choices.", "The path is saved when you continue."],
  build: ["Two ways in: the suggested plan in one tap, or Build my own from whole series or single episodes, with a running count.", "Review shows the plan day by day; move any episode up or down."],
  "done-sogp": ["Every path ends here, on Learning, with today’s step on the card and Your path under it."],
  "done-podcast": ["Your path shows the plan in counts, the next few days, then SOGP from level 1, as the Pastor described."],
  journey: ["The Teachings Library sits inside the picker (real Library titles, read only). Open a series, add it whole or tick single teachings.", "The tray shows how many days the journey runs and when it ends. Then put the teachings in order."],
  "done-own": ["Every path ends on Learning: day 1 of the journey on the card, and Your path under it."],
  left: ["Someone who chose Podcast and left keeps the path. The card says “Finish building your plan”, so it can’t be mistaken for listening."],
};

const BLUE = { "--hub-art": `url("/assets/dashboard/learning-card/my-learning-background-v5.webp")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/my-learning-background-v5-wide.webp")`, "--hub-field": "#2056d6", "--hub-ink": "#2056d6" } as CSSProperties;

function Card({ top, pace, title, line, action, href, play }: { top: string; pace?: string; title: string; line: string; action: string; href: string; play?: boolean }) {
  return <section className={hub.card} style={BLUE}>
    <div className={hub.cardTop}><span>{top}</span>{pace ? <span className={hub.pace}>{pace}</span> : null}</div>
    <div><h2>{title}</h2><span className={`${hub.cardMeta} ${mock.narrowMeta}`}>{line}</span></div>
    <Link href={href} className={`${hub.resume} ${mock.resumeFit}`}>{action}{play ? <PlayIcon className="size-4" fill="currentColor" strokeWidth={0} /> : <ArrowRightIcon className="size-4" strokeWidth={2.2} />}</Link>
  </section>;
}

type Row = { title: string; meta: string; end?: string; muted?: boolean };

/**
 * Your path on Learning, in the dashboard's own vocabulary (user, 24 November):
 * a three-count strip, then a panel of rows, then one note. No timeline.
 */
function PathSummary({ counts, listTitle, rows, more, note, empty }: { counts: [string, string | number][]; listTitle: string; rows: Row[]; more?: string; note?: ReactNode; empty?: string }) {
  return <>
    <div className={groupStyles.sectionTitle}><h2>Your path</h2><Link href="?screen=choose" className={`${groupStyles.quiet} inline-flex items-center gap-0.5`}>Change path<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link></div>
    <div className={groupStyles.strip}>{counts.map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className={groupStyles.sectionTitle}><h2>{listTitle}</h2>{more ? <Link href="#" className={groupStyles.quiet}>{more}</Link> : null}</div>
    <div className={groupStyles.panel}>{rows.length ? <ul className={groupStyles.list}>{rows.map(row => <li key={row.title + row.meta}>
      <Link href="#" className={groupStyles.row} style={row.muted ? { color: "var(--color-community-muted)" } : undefined}>
        <span className={groupStyles.rowCopy}><span className={groupStyles.rowTitle}>{row.title}</span><span className={groupStyles.rowMeta}>{row.meta}</span></span>
        {row.end ? <span className={groupStyles.rowMeta}>{row.end}</span> : null}
        <ChevronRightIcon className={`${groupStyles.chev} size-4`} strokeWidth={2} aria-hidden="true" />
      </Link></li>)}</ul> : <p className={groupStyles.empty}>{empty}</p>}</div>
    {note ? <p className={groupStyles.note}>{note}</p> : null}
  </>;
}

function Learning({ sub, children }: { sub: string; children: ReactNode }) {
  return <div className={hub.page}><div className={hub.column}>
    <div><h1>Learning</h1><p className={groupStyles.sub}>{sub}</p></div>
    {children}
  </div></div>;
}


/** The Library catalogue grouped by series, in Library order. Read only; teaching titles are public. */
async function libraryBySeries(): Promise<LibrarySeries[]> {
  const rows = await getAllTeachings().catch(() => []);
  const groups = new Map<string, LibrarySeries>();
  for (const row of rows) {
    const group = groups.get(row.series) ?? { series: row.series, teachings: [] };
    group.teachings.push({ id: String(row.id), title: row.title.replace(/\s+[-–]\s+[A-Z][a-z]{2,4}\.?\s+\d{1,2},\s+\d{4}$/, ""), duration: row.duration ? `${Math.floor(row.duration / 60)}:${String(row.duration % 60).padStart(2, "0")}` : "" });
    groups.set(row.series, group);
  }
  return [...groups.values()];
}

export default async function LearningPathOnboardingPreview({ searchParams }: { searchParams: Promise<{ screen?: string; pace?: string }> }) {
  const query = await searchParams;
  const screen: Screen = query.screen && query.screen in SCREENS ? query.screen as Screen : "home";
  const pace = query.pace === "one" ? 1 : 2;
  const podcast = podcastRoad(2);
  const library = screen === "journey" || screen === "done-own" ? await libraryBySeries() : [];
  const levels = sogpLevels(1, SOGP_LEVELS);
  const plan = suggestedPlan(60);
  const podcastDays = [0, 1, 2].map(day => plan.slice(day * 2, day * 2 + 2));
  const seriesName = (guid: string) => EPISODES.get(guid)!.title.replace(/\s*\(Part \d+\)$/, "");
  const journeyDays = library.flatMap(group => group.teachings.map(item => ({ title: item.title, series: group.series }))).slice(0, 3);

  const view = screen === "home" ? <div className={hub.page}><div className={hub.column}>
      <h1>Good morning, Sam</h1>
      <Card top="SOGP November 2026" title="Make room to grow" line="Pick a path and see where it takes you" action="Choose a learning path" href="?screen=choose" />
    </div></div>
    : screen === "learning" ? <Learning sub="SOGP November 2026">
      <Card top="SOGP November 2026" title="Choose a learning path" line="SOGP, podcasts, or a doctrinal journey" action="Choose a path" href="?screen=choose" />
    </Learning>
    : screen === "choose" ? <ChooserMock />
    : screen === "build" ? <BuilderMock pace={pace} />
    : screen === "journey" ? <JourneyMock library={library} />
    : screen === "done-sogp" ? <Learning sub="SOGP · 1 hr a day">
      <Card top="Level 1 · Day 1" pace="1 hr a day" title="Gospel: The Word of Truth" line="Teaching, quiz and written response" action="Start today’s teaching" href="#" play />
      <PathSummary counts={[["Tracks", levels.tracks], ["Levels", 3], ["Done by", shortDate(levels.finish)]]} listTitle="Levels"
        rows={[...levels.stops.map(stop => ({ title: `Level ${stop.level}`, meta: `${stop.trackCount} tracks · ${stop.soon ? "Coming soon" : stop.range}`, end: stop.level === 1 ? "Now" : undefined, muted: stop.soon })), { title: "Advanced SOGP", meta: "After level 4", muted: true }]}
        note="A track a day, with a group review at the end of each level." />
    </Learning>
    : screen === "done-podcast" ? <Learning sub="Podcast · 30 min a day">
      <Card top="Day 1 of 30" pace="30 min a day" title="The Reality of God’s Purpose" line="Parts 1 and 2 · about 30 min" action="Listen to day 1" href="#" play />
      <PathSummary counts={[["Episodes", 60], ["Days", 30], ["Done by", shortDate(podcast.finish)]]} listTitle="Coming up" more="See all 30 days"
        rows={podcastDays.map((guids, day) => ({ title: seriesName(guids[0]!), meta: `Day ${day + 1} · ${guids.map(guid => `Part ${EPISODES.get(guid)!.part}`).join(" and ")}`, end: shortDate(addDays(day)) }))}
        note={<>Then SOGP from level 1, from {shortDate(addDays(30))}.</>} />
    </Learning>
    : screen === "done-own" ? <Learning sub="Doctrinal journey">
      <Card top="Day 1 of 24" pace="One a day" title={journeyDays[0]?.title ?? "Your first teaching"} line={journeyDays[0] ? `${journeyDays[0].series} · from the Library` : "From the series you chose"} action="Listen to day 1" href="#" play />
      <PathSummary counts={[["Teachings", 24], ["Days", 24], ["Done by", shortDate(addDays(23))]]} listTitle="Coming up" more="See all 24"
        rows={journeyDays.map((item, day) => ({ title: item.title, meta: `Day ${day + 1} · ${item.series}`, end: shortDate(addDays(day)) }))}
        note="Add more teachings from the Library at any time." />
    </Learning>
    : <Learning sub="Podcast · 30 min a day">
      <Card top="Podcast · 30 min a day" title="Finish building your plan" line="Your path is saved. Pick your 60 episodes, or take ours" action="Build my plan" href="?screen=build&pace=two" />
      <PathSummary counts={[["Episodes", "0 of 60"], ["Days", 30], ["Pace", "30 min"]]} listTitle="Coming up" rows={[]}
        empty="Your plan is empty. Take the suggested plan or pick your own episodes." />
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
