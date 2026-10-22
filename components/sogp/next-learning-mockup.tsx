"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { BellIcon, CheckIcon, ChevronRightIcon, PlayIcon } from "lucide-react";

import groupStyles from "@/components/community/discipleship/discipleship-group.module.css";
import { ReportSheet, sheetStyles as sheet } from "@/components/community/report/report-sheet";

import learningStyles from "./learning/learning-hub.module.css";
import { OtherLearning } from "./learning/other-learning";

/**
 * Mockup (sample data, nothing saved) of choosing the next phase after SOGP
 * (Pastor, 21 October): people who finish choose their next set of teachings,
 * so they always have something to learn, share and post. The choice becomes
 * their current learning, heading Learning. Only what exists today is
 * offered: SOGP already uses every PPC teaching but one, and PPC Levels 4 and
 * 5 are placeholders.
 */

type Option = { key: string; art: "podcast" | "sogp" | "library" | "pre-sogp" | "advanced"; title: string; detail: string; meta: string; soon?: boolean };
const OPTIONS: Option[] = [
  { key: "foundations", art: "podcast", title: "The Foundations podcast", detail: "The Place of the Gospel, The Reality, Pursuit and Fulfilment of God’s Purpose", meta: "30 days · 15 or 30 min a day" },
  { key: "sogp-again", art: "sogp", title: "SOGP again, the podcast way", detail: "You took a lesson a day. Go through it again as podcasts, at your own pace", meta: "15 or 30 min a day" },
  { key: "series", art: "library", title: "A series from the Library", detail: "Pick any teaching series and listen through it", meta: "Choose the series next" },
  { key: "commitment", art: "pre-sogp", title: "Commitment: How to Fulfil Purpose", detail: "The one PPC teaching SOGP doesn’t include", meta: "1 teaching with notes and a quiz" },
  { key: "advanced", art: "advanced", title: "Advanced SOGP", detail: "Deeper formation for those who’ve finished SOGP", meta: "Coming soon", soon: true },
];

const thumb = (art: Option["art"]): CSSProperties => ({ backgroundImage: `image-set(url("/assets/dashboard/learning-cards/${art}-tile-192.webp") 1x, url("/assets/dashboard/learning-cards/${art}-tile-384.webp") 2x)` });

export function NextLearningMockup({ screen }: { screen: "learning" | "choose" | "chosen" }) {
  const [choice, setChoice] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [notify, setNotify] = useState(false);

  if (screen === "learning") return <div className="grid gap-3.5">
    <div><h1>Learning</h1><p className={groupStyles.sub}>SOGP October 2026 · Completed</p></div>
    <div className={learningStyles.sectionTitle}><h2>School of God’s Purpose</h2><Link href="#" className="inline-flex items-center gap-0.5">Open<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link></div>
    <section className={learningStyles.card} aria-label="SOGP finished" style={{ "--hub-art": `url("/assets/dashboard/learning-card/my-learning-level-4.webp")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/my-learning-level-4-wide.webp")`, "--hub-field": "#56298a", "--hub-ink": "#4a2275" } as CSSProperties}>
      <div className={learningStyles.cardTop}><span>SOGP October 2026 · Completed</span></div>
      <div><h2>You’ve finished SOGP</h2><span className={learningStyles.cardMeta}>24 teachings · certificate ready</span></div>
      <Link href="?screen=choose" className={learningStyles.resume}>Choose what’s next <ChevronRightIcon className="size-4" strokeWidth={2.2} /></Link>
    </section>
    <p className={learningStyles.notice}>Choose your next teachings so you always have something to learn and share. It becomes your current learning here.</p>
  </div>;

  if (screen === "chosen") return <div className="grid gap-3.5">
    <div><h1>Learning</h1><p className={groupStyles.sub}>Your next learning · day 1 of 30</p></div>
    {/* The new current learning, a class of its own: its name heads the card playing from it. */}
    <div className={learningStyles.sectionTitle}><h2>The Foundations podcast</h2><Link href="?screen=choose" className="inline-flex items-center gap-0.5">Change<ChevronRightIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" /></Link></div>
    <section className={learningStyles.card} aria-label="Resume learning" style={{ "--hub-art": `url("/assets/dashboard/learning-card/my-learning-background-v5.webp")`, "--hub-art-wide": `url("/assets/dashboard/learning-card/my-learning-background-v5-wide.webp")`, "--hub-field": "#2056d6", "--hub-ink": "#2056d6" } as CSSProperties}>
      <div className={learningStyles.cardTop}><span>Day 1</span><span className={learningStyles.pace}>15 min/day · Podcast</span></div>
      <div><h2>The Place of the Gospel</h2><span className={learningStyles.cardMeta}>Part 1 of 4 · 0 of 30 days</span><div className={learningStyles.meter} aria-hidden="true"><i style={{ width: "2%" }} /></div></div>
      <Link href="#" className={learningStyles.resume}>Start day 1 <PlayIcon className="size-4" fill="currentColor" strokeWidth={0} /></Link>
    </section>
    <div className={learningStyles.sectionTitle}><h2>Other learning</h2></div>
    <OtherLearning tiles={[
      { art: "sogp", title: "School of God’s Purpose", tag: "Done", meta: "Certificate ready", href: "#" },
      { art: "advanced", title: "Advanced SOGP", tag: "Coming soon", meta: "After SOGP", href: "#" },
      { art: "library", title: "Library", tag: "Any time", meta: "Teachings and series", href: "#" },
      { art: "welcome", title: "Welcome Pack", tag: "Done", meta: "Gifts and orientation", href: "#" },
    ]} />
  </div>;

  const picked = OPTIONS.find(option => option.key === choice) ?? null;
  return <div className="grid gap-3.5">
    <div><h1>What’s next?</h1><p className={groupStyles.sub}>You’ve finished SOGP. Choose what you’ll learn next</p></div>
    <div className={groupStyles.panel}><ul className={groupStyles.list} role="radiogroup" aria-label="Your next learning">
      {OPTIONS.map(option => {
        const on = choice === option.key;
        const body = <>
          <span className="size-12 shrink-0 rounded-[12px] bg-cover bg-center" style={thumb(option.art)} aria-hidden="true" />
          <span className={`${groupStyles.rowCopy} gap-0.5`}>
            <span className={groupStyles.rowTitle} style={{ whiteSpace: "normal" }}>{option.title}</span>
            <span className={groupStyles.rowMeta} style={{ whiteSpace: "normal" }}>{option.detail}</span>
            <span className={groupStyles.rowMeta} style={{ color: option.soon ? "#a15c12" : "var(--color-community-blue)" }}>{option.meta}</span>
          </span>
        </>;
        // Advanced SOGP can't be chosen yet: a plain row with its own Notify me, never a button inside a button.
        return <li key={option.key}>{option.soon
          ? <div className={`${groupStyles.row} items-start`}>
            {body}
            <button type="button" className={`${groupStyles.btn} ${groupStyles.mini} mt-1 shrink-0`} aria-pressed={notify} onClick={() => setNotify(value => !value)}>
              {notify ? <><CheckIcon className="size-3.5" strokeWidth={2.4} aria-hidden="true" />Notifying</> : <><BellIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />Notify me</>}
            </button>
          </div>
          : <button type="button" role="radio" aria-checked={on} onClick={() => setChoice(option.key)}
            className={`${groupStyles.row} w-full items-start text-left`} style={on ? { background: "#f6f8fe" } : undefined}>
            {body}
            <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full border-[1.5px]" style={{ borderColor: on ? "var(--color-community-blue)" : "#c9ced6", background: on ? "var(--color-community-blue)" : "transparent" }} aria-hidden="true">
              {on ? <CheckIcon className="size-3 text-white" strokeWidth={3} /> : null}
            </span>
          </button>}
        </li>;
      })}
    </ul></div>
    <button type="button" className={`${groupStyles.btn} h-[38px] justify-self-stretch text-[13.5px]`} data-primary disabled={!picked} onClick={() => setConfirm(true)}>Make it my current learning</button>
    <p className={groupStyles.note}>Your SOGP history and certificate stay as they are. You can change your next learning any time from Learning.</p>

    {confirm && picked ? <ReportSheet title={`Start ${picked.title}?`} subtitle="It becomes your current learning, at the top of Learning" onClose={() => setConfirm(false)}
      footer={close => <>
        <button type="button" className={sheet.quiet} onClick={close}>Not yet</button>
        <Link href="?screen=chosen" className={`${sheet.primary} ${sheet.fit} no-underline`}>Start</Link>
      </>}>
      {() => <p className={sheet.muted}>{picked.key === "series" ? "Next you’ll pick the series. Your days start the day you begin." : "Day 1 starts today. Missed days wait for you, as in SOGP."}</p>}
    </ReportSheet> : null}
  </div>;
}
