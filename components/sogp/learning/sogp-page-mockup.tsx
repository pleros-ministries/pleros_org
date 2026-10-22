import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { AwardIcon, CalendarCheckIcon, ChevronRightIcon, HistoryIcon, InfoIcon, MessageCircleQuestionIcon, PlayIcon, RepeatIcon, UserRoundIcon } from "lucide-react";

import styles from "@/components/community/discipleship/discipleship-group.module.css";

import cards from "./learning-cards.module.css";

/**
 * Mockup (sample data, nothing saved): the SOGP page designed (user, 22
 * October: "this page is not designed at all"). The SOGP card heads it in its
 * own coral field with the gem; the certificate is three counts, coloured only
 * where something is missing; the four levels are tiles in their own level
 * art; After SOGP is a card; Your learning stays a quiet list at the foot.
 */

const AMBER = "#a15c12", GREEN = "var(--color-community-green-ink)";
const LEVELS = [
  { level: 1, title: "Gospel foundations and the Spirit", done: 6, total: 6, field: "#2056d6", art: "my-learning-background-v5.webp" },
  { level: 2, title: "Doctrinal foundations", done: 3, total: 6, field: "#24704d", art: "my-learning-level-2.webp" },
  { level: 3, title: "Redemption and lived faith", done: 0, total: 6, field: "#b84f35", art: "my-learning-level-3.webp" },
  { level: 4, title: "Practical life and assignment", done: 0, total: 6, field: "#56298a", art: "my-learning-level-4.webp" },
];

const art = (key: string, field: string, ink: string): CSSProperties => ({
  backgroundColor: field, color: ink,
  ["--art-1x" as string]: `url("/assets/dashboard/learning-cards/${key}-tile-192.webp")`,
  ["--art-2x" as string]: `url("/assets/dashboard/learning-cards/${key}-tile-384.webp")`,
});

function Count({ value, label, detail, warn }: { value: string; label: string; detail: string; warn: boolean }) {
  return <div className="grid min-w-0 content-start gap-0.5 px-3 py-3 first:pl-0 last:pr-0">
    <span className="text-[12px] leading-4 text-(--color-community-muted)">{label}</span>
    <b className="font-[family-name:var(--font-dashboard-heading)] text-[22px] leading-7 font-medium tabular-nums" style={{ color: warn ? AMBER : "var(--color-community-ink)" }}>{value}</b>
    <span className="inline-flex items-center gap-1 text-[11.5px] leading-4" style={{ color: warn ? AMBER : GREEN }}>
      <i className="size-1.5 shrink-0 rounded-full" style={{ background: warn ? "#d98a1f" : GREEN }} aria-hidden="true" />{detail}
    </span>
  </div>;
}

function Tool({ icon, title, meta }: { icon: ReactNode; title: string; meta: string }) {
  return <li><Link href="#" className={styles.row}>
    <span className="shrink-0 text-[var(--color-community-muted)] [&>svg]:size-4" aria-hidden="true">{icon}</span>
    <span className={styles.rowCopy}><span className={styles.rowTitle}>{title}</span><span className={styles.rowMeta}>{meta}</span></span>
    <ChevronRightIcon className={`${styles.chev} size-4`} strokeWidth={2} />
  </Link></li>;
}

export function SogpPageMockup() {
  return <div className="grid gap-3.5">
    {/* The SOGP card: a class of its own, in its own coral field with the gem. */}
    <section className={`${cards.card} min-h-[196px]! gap-4! p-4!`} style={{ ...art("sogp", "#fcd9c7", "#6e2a17"), ["--art-size" as string]: "132px" }} aria-label="School of God’s Purpose">
      <span className={cards.art} aria-hidden="true" />
      <span className={cards.top} style={{ maxWidth: "calc(100% - 40px)" }}>
        <span className={cards.tag}>SOGP October 2026 · Traditional</span>
        <h1 className="m-0 font-[family-name:var(--font-dashboard-heading)] text-[24px]! leading-8! font-medium">School of God’s Purpose</h1>
        <span className="text-[13px] leading-5 opacity-85">Day 10 of 28 · 9 of 24 teachings</span>
      </span>
      <span className="relative z-[1] grid max-w-[60%] gap-3">
        <span className="block h-1.5 overflow-hidden rounded-full bg-[rgb(110_42_23/16%)]" aria-hidden="true"><i className="block h-full rounded-full bg-[#6e2a17]" style={{ width: "38%" }} /></span>
        <Link href="#" className="inline-flex h-[38px] items-center justify-center gap-2 justify-self-start rounded-[10px] bg-white px-4 text-[13.5px] font-medium text-[#6e2a17] no-underline shadow-[0_1px_2px_rgb(0_0_0/8%)]">Resume track 10 <PlayIcon className="size-3.5" fill="currentColor" strokeWidth={0} /></Link>
      </span>
    </section>

    {/* The certificate: three counts, colour only where something is missing. */}
    <div className={styles.sectionTitle}><h2>Your certificate</h2><Link href="#" className={styles.quiet}>See what’s left</Link></div>
    <div className={`${styles.panel} px-4`}>
      <div className="flex items-center gap-2.5 border-b border-[var(--dashboard-panel-edge,#e2e5ea)] py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[#f6e4ac] text-[#5a4508]" aria-hidden="true"><AwardIcon className="size-[18px]" strokeWidth={2} /></span>
        <span className={styles.rowCopy}><span className={styles.rowTitle}>2 things left</span><span className={styles.rowMeta}>Your certificate unlocks when all three are in</span></span>
      </div>
      <div className="grid grid-cols-3 divide-x divide-[var(--dashboard-panel-edge,#e2e5ea)]">
        <Count label="Teachings" value="9" detail="of 24" warn />
        <Count label="Prayer Watch" value="64%" detail="needs 80%" warn />
        <Count label="Reviews" value="1" detail="all in" warn={false} />
      </div>
    </div>

    {/* The four levels as tiles, each in its own level art. */}
    <div className={styles.sectionTitle}><h2>Your four levels</h2><Link href="#" className={styles.quiet}>Your 28 days</Link></div>
    <div className="grid grid-cols-2 gap-2.5">
      {LEVELS.map(level => {
        const state = level.done === level.total ? "Done" : level.done ? "Now" : null;
        return <Link key={level.level} href="#" className="relative grid min-h-[136px] content-between gap-2 overflow-hidden rounded-[16px] p-3 text-white no-underline"
          style={{ backgroundColor: level.field, backgroundImage: `url("/assets/dashboard/learning-card/${level.art}")`, backgroundSize: "auto 150%", backgroundPosition: "right -34px bottom -26px", backgroundRepeat: "no-repeat", opacity: state ? 1 : 0.92 }}>
          <span className="grid gap-1.5" style={{ maxWidth: "88%" }}>
            <span className="inline-flex h-[22px] items-center justify-self-start rounded-full bg-[rgb(255_255_255/20%)] px-2 text-[11.5px] leading-4 font-medium">Level {level.level}{state ? ` · ${state}` : ""}</span>
            <span className="text-[14px] leading-[19px] font-medium">{level.title}</span>
          </span>
          <span className="grid max-w-[62%] gap-1.5">
            <span className="text-[12px] leading-4 opacity-90">{state ? `${level.done} of ${level.total} teachings` : "Opens Mon 26 Oct"}</span>
            <span className="block h-1 overflow-hidden rounded-full bg-[rgb(255_255_255/24%)]" aria-hidden="true"><i className="block h-full rounded-full bg-white" style={{ width: `${(level.done / level.total) * 100}%` }} /></span>
          </span>
        </Link>;
      })}
    </div>

    {/* After SOGP: a card in the Advanced SOGP lilac, the accepted violet. */}
    <div className={styles.sectionTitle}><h2>After SOGP</h2></div>
    <Link href="#" className={`${cards.card} min-h-[112px]!`} style={art("advanced", "#e6dbfb", "#3e1876")}>
      <span className={cards.art} aria-hidden="true" />
      <span className={cards.top}>
        <span className={cards.tag}>Opens when you finish</span>
        <h3>Choose your next teachings</h3>
      </span>
      <span className={cards.meta}>A podcast journey, a series or your own episodes</span>
    </Link>

    {/* Your learning: quiet, at the foot, where people look for settings. */}
    <div className={styles.sectionTitle}><h2>Your learning</h2></div>
    <div className={styles.panel}><ul className={styles.list}>
      <Tool icon={<RepeatIcon />} title="Change path or pace" meta="1 hr/day · Traditional" />
      <Tool icon={<HistoryIcon />} title="History" meta="9 teachings done" />
      <Tool icon={<CalendarCheckIcon />} title="Group reviews" meta="Next: Sunday 25 October" />
      <Tool icon={<MessageCircleQuestionIcon />} title="Ask about a teaching" meta="Your leader answers" />
      <Tool icon={<UserRoundIcon />} title="Your follow-up person" meta="Assigned soon" />
      <Tool icon={<InfoIcon />} title="How SOGP works" meta="Days, reviews and the certificate" />
    </ul></div>
  </div>;
}
