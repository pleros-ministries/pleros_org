import Link from "next/link";

import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import styles from "@/components/dashboard/v3/dashboard.module.css";
import hubStyles from "@/components/sogp/learning/learning-hub.module.css";
import { LearningHub } from "@/components/sogp/learning/learning-hub";
import { OwnJourneyBuilder, SeriesPicker } from "@/components/sogp/next-learning/episode-pickers";
import { NextLearningChooser, type NextOption } from "@/components/sogp/next-learning/next-learning-chooser";
import type { LearningHubData } from "@/lib/dashboard/learning-hub";
import type { LearningViewData } from "@/lib/sogp/learning-view";

import { SAMPLE_HUB } from "../learning-slim/sample";

export const metadata = { title: "What’s next preview", robots: { index: false, follow: false } };

// Reads searchParams on every request (Cache Components).
export const instant = false;

/** The real screens for choosing what's next after SOGP, on sample data. Nothing saves. */
const FINISHED: LearningHubData = {
  ...SAMPLE_HUB, state: "completed", weekLabel: null, doneCount: 24, certificate: { available: true },
  card: { ...SAMPLE_HUB.card, done: 24, total: 24 }, next: { canChoose: true, finished: true, card: null },
};
const CHOSEN: LearningHubData = { ...FINISHED, next: { canChoose: true, finished: true, card: { kind: "podcast", title: "30-day Foundations", dayNumber: 3, totalDays: 30, listened: 2, finished: false, episodeTitle: "The Place of the Gospel in Your Life (Part 3)", todayListened: false } } };

const OPTIONS: NextOption[] = [
  { key: "foundations", art: "podcast", title: "The Foundations podcast", detail: "The Place of the Gospel, The Reality and Pursuit of God’s Purpose, and How to Fulfil it", meta: "30 days · one episode a day", pick: { kind: "foundations" } },
  { key: "series", art: "library", title: "A series from the Library", detail: "Pick a teaching series and listen through it, one episode a day", meta: "Choose the series next", href: "?screen=series" },
  { key: "own", art: "sogp", title: "Your own podcast journey", detail: "Pick the episodes you want, in the order you want, one a day", meta: "Choose your episodes next", href: "?screen=own" },
];

const SERIES = ["Walk of Faith", "Favour in the Newness of Life", "Our Supernatural Nature in Christ", "The Reality of God’s Purpose", "Kingdom Living", "Grace to Grow", "Prayer that Works", "Hearing God", "The Love Walk"]
  .map((title, index) => ({ id: `s${index}`, title, description: index % 2 ? null : "A teaching series from the Library.", episodes: 4 + index, listened: index % 3, current: false }));
const EPISODES = Array.from({ length: 20 }, (_, index) => ({ guid: `e${index}`, title: `${["Walk of Faith", "Hearing God", "Grace to Grow", "Kingdom Living"][index % 4]} (Part ${Math.floor(index / 4) + 1})`, duration: "00:24:10" }));

const SCREENS = { learning: "1 Finished", choose: "2 Choose", series: "3 Series", own: "4 Own journey", chosen: "5 Chosen" } as const;
type Screen = keyof typeof SCREENS;

export default async function NextLearningPreview({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const raw = (await searchParams).screen;
  const screen: Screen = raw && raw in SCREENS ? raw as Screen : "learning";
  const learning = { followUp: null } as unknown as LearningViewData;
  const column = (node: React.ReactNode) => <div className={hubStyles.page}><div className={hubStyles.column}>{node}</div></div>;
  return <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardHeadingFont.variable} ${styles.root} min-h-dvh bg-[var(--color-community-canvas,#f8f6f2)] [&_h1]:text-[21px] [&_h1]:leading-[28px] [&_h1]:font-medium`} data-dashboard-v3>
    <div className="grid gap-1 px-4 py-2 text-xs text-(--color-text-muted)">
      <span>Preview · after SOGP · sample data · nothing saved</span>
      <span className="flex flex-wrap gap-x-3">{(Object.keys(SCREENS) as Screen[]).map(key => <Link key={key} href={`?screen=${key}`} className={key === screen ? "font-medium text-(--color-community-ink)" : "underline"}>{SCREENS[key]}</Link>)}</span>
    </div>
    {screen === "learning" ? <LearningHub hub={FINISHED} learning={learning} />
      : screen === "choose" ? column(<NextLearningChooser options={OPTIONS} advancedInterest={false} finished preview />)
      : screen === "series" ? column(<SeriesPicker series={SERIES} preview />)
      : screen === "own" ? column(<OwnJourneyBuilder episodes={EPISODES} initial={["e0", "e4"]} max={120} preview />)
      : <LearningHub hub={CHOSEN} learning={learning} />}
  </div>;
}
