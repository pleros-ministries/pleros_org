"use client";

import { useState, type CSSProperties } from "react";
import { ChevronRightIcon, PlayIcon } from "lucide-react";

import g from "@/components/community/discipleship/discipleship-group.module.css";
import { Segmented } from "@/components/community/report/report-sheet";
import hub from "@/components/sogp/learning/learning-hub.module.css";

type Path = "doctrinal" | "podcast" | "personalised";
type Screen = "learning" | "sogp";

const ART = (image: string, field: string, ink: string) => ({ "--hub-art": `url("/assets/dashboard/learning-card/${image}.webp")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/${image}-wide.webp")`, "--hub-field": field, "--hub-ink": ink }) as CSSProperties;

/** Sample learner, sample titles: one card, the rest of the month, your path. */
const SAMPLE: Record<Path, {
  art: CSSProperties; top: string; title: string; meta: string; done: number; total: number; action: string;
  month: Array<{ when: string; title: string; state?: string }>;
  path: string; pace: string; certificate: string; note: string;
}> = {
  doctrinal: {
    art: ART("my-learning-level-2", "#24704d", "#1d5e40"), top: "Level 2", title: "Biblical Origin and Ontology", meta: "Track 10 of 24", done: 9, total: 24, action: "Resume track 10",
    month: [{ when: "Today", title: "Biblical Origin and Ontology", state: "Not yet" }, { when: "Fri 28 Nov", title: "The Nature of Man" }, { when: "Sat 29 Nov", title: "Level 2 review with your group" }],
    path: "Doctrinal path", pace: "A track a day, about an hour", certificate: "9 of 24 tracks · Prayer Watch on track", note: "Prayer Watch and Bible reading for today are on Home.",
  },
  podcast: {
    art: ART("my-learning-background-v5", "#2056d6", "#2056d6"), top: "Episodes 19 and 20 of 60", title: "The Reality of God’s Purpose", meta: "Parts 19 and 20 today", done: 18, total: 60, action: "Listen now",
    month: [{ when: "Today", title: "Parts 19 and 20", state: "Not yet" }, { when: "Fri 28 Nov", title: "Parts 21 and 22" }, { when: "Sat 29 Nov", title: "Parts 23 and 24" }],
    path: "Podcast", pace: "Two episodes a day, about 30 minutes", certificate: "18 of 60 episodes · Prayer Watch on track", note: "6 episodes left in November; the other 36 follow in December.",
  },
  personalised: {
    art: ART("my-learning-background-v5", "#2056d6", "#2056d6"), top: "Teaching 3 of 5", title: "Understanding the Gospel", meta: "Faith and growth", done: 2, total: 5, action: "Listen now",
    month: [{ when: "Today", title: "Understanding the Gospel", state: "Not yet" }, { when: "Fri 28 Nov", title: "Walking in the Spirit" }, { when: "Sat 29 Nov", title: "The Church as Family" }],
    path: "Personalised path", pace: "One teaching a day, chosen by you", certificate: "2 of 5 teachings · Prayer Watch on track", note: "Add teachings from the Library at any time.",
  },
};

const LEVELS = [
  { title: "Level 1 · Foundations", meta: "6 tracks · 24–29 Nov", end: "Done", tone: "ok" },
  { title: "Level 2 · Origin and identity", meta: "6 tracks · 1–6 Dec", end: "3 of 6", tone: null },
  { title: "Level 3 · Purpose", meta: "6 tracks · 8–13 Dec", end: null, tone: null },
  { title: "Level 4 · Ministry", meta: "Opens in January", end: null, tone: null, muted: true },
];

function Chevron() { return <ChevronRightIcon className="size-4 shrink-0 text-[#a6abb2]" strokeWidth={2} aria-hidden="true" />; }

function Row({ title, meta, end, tone, muted, link }: { title: string; meta?: string; end?: string | null; tone?: string | null; muted?: boolean; link?: boolean }) {
  return <li><div className={g.row} style={muted ? { opacity: .55 } : undefined}>
    <span className={g.rowCopy}><span className={g.rowTitle}>{title}</span>{meta ? <span className={g.rowMeta}>{meta}</span> : null}</span>
    {end ? <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-(--color-community-muted)">{tone ? <span className={g.dot} data-tone={tone} /> : null}{end}</span> : null}
    {link ? <Chevron /> : null}
  </div></li>;
}

function Section({ title, link, children }: { title: string; link?: string; children: React.ReactNode }) {
  return <>
    <div className={g.sectionTitle}><h2>{title}</h2>{link ? <span className={`${g.quiet} inline-flex items-center gap-0.5`}>{link}<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></span> : null}</div>
    <div className={g.panel}><ul className={g.list}>{children}</ul></div>
  </>;
}

export function SimpleLearning() {
  const [screen, setScreen] = useState<Screen>("learning");
  const [path, setPath] = useState<Path>("doctrinal");
  const data = SAMPLE[path];

  return <div className={hub.page}>
    <div className="grid gap-2">
      <Segmented label="Screen" options={[{ key: "learning", label: "Learning" }, { key: "sogp", label: "SOGP page" }]} value={screen} onChange={setScreen} />
      {screen === "learning" ? <Segmented label="Path" options={[{ key: "doctrinal", label: "Doctrinal" }, { key: "podcast", label: "Podcast" }, { key: "personalised", label: "Personalised" }]} value={path} onChange={setPath} /> : null}
    </div>

    {screen === "learning" ? <div className={hub.column}>
      <div><h1>Learning</h1><p className={g.sub}>November · 4 days left</p></div>

      {/* One card: what's next. Nothing above it but the page heading. */}
      <section className={hub.card} style={data.art}>
        <div className={hub.cardTop}><span>{data.top}</span></div>
        <div>
          <h2>{data.title}</h2>
          <span className={hub.cardMeta}>{data.meta}</span>
          <div className={hub.meter} aria-hidden="true"><i style={{ width: `${Math.round(data.done / data.total * 100)}%` }} /></div>
        </div>
        <span className={hub.resume}>{data.action} <PlayIcon className="size-4" fill="currentColor" strokeWidth={0} /></span>
      </section>

      {/* The month, in words: no counts strip. */}
      <Section title="Rest of November" link="See November">
        {data.month.map(item => <Row key={item.when} title={item.title} meta={item.when} end={item.state} tone={item.state ? "risk" : null} />)}
      </Section>

      {/* Everything about the path in one place, two rows. */}
      <Section title="Your path" link="Change">
        <Row title={data.path} meta={data.pace} />
        <Row title="Certificate" meta={data.certificate} link />
      </Section>

      <p className={g.note}>{data.note}</p>
    </div> : <div className={hub.column}>
      <div><h1>School of God’s Purpose</h1><p className={g.sub}>Doctrinal path · November</p></div>

      <Section title="Your certificate" link="See what’s left">
        <Row title="Tracks" meta="9 of 24 done" end="On track" tone="ok" />
        <Row title="Prayer Watch" meta="18 of 27 mornings" end="On track" tone="ok" />
        <Row title="Group reviews" meta="1 of 3" end="1 missed" tone="risk" />
      </Section>

      <Section title="Levels">
        {LEVELS.map(level => <Row key={level.title} title={level.title} meta={level.meta} end={level.end} tone={level.tone} muted={level.muted} link={!level.muted} />)}
      </Section>

      <Section title="After SOGP">
        <Row title="Advanced SOGP" meta="Opens after level 4" link />
      </Section>

      <p className={g.note}>A track a day, with a group review at the end of each level.</p>
    </div>}
  </div>;
}
