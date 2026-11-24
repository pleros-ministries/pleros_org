"use client";
import { useState, useTransition, type CSSProperties, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon, LockIcon } from "lucide-react";

import { chooseSogpPathAction } from "@/app/_actions/sogp-learning-actions";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";
import { isPlanPath, isTeachingKey, type SogpLearningPath } from "@/lib/sogp/learning-input";
import { learningWriteNotice, type LearningViewData } from "@/lib/sogp/learning-view";

import learn from "./learning.module.css";
import styles from "./learning-paths.module.css";
import { PaceSwitchConfirm, PathSwitchConfirm } from "./path-switch";

type PathKey = "sogp" | "podcast" | "doctrinal";

/** Each path takes its learning-card field and object (DESIGN.md). Podcast is the brighter sky (user, 24 November). */
const ART: Record<PathKey, { art: string; field: string; ink: string }> = {
  sogp: { art: "sogp", field: "#fcd9c7", ink: "#6e2a17" },
  podcast: { art: "podcast-sky", field: "#d4e8fc", ink: "#16406e" },
  doctrinal: { art: "library", field: "#f3e0c4", ink: "#4d3a26" },
};
const look = (key: PathKey) => ({
  "--field": ART[key].field, "--ink": ART[key].ink,
  "--art-1x": `url("/assets/dashboard/learning-cards/${ART[key].art}-tile-192.webp")`,
  "--art-2x": `url("/assets/dashboard/learning-cards/${ART[key].art}-tile-384.webp")`,
}) as CSSProperties;

const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Lagos" });
const longDate = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "Africa/Lagos" });
/** "24–29 Nov", or "28 Nov – 4 Dec" across months. */
function dateRange(from: Date, to: Date) {
  const part = (date: Date, type: "day" | "month") => dayMonth.formatToParts(date).find(entry => entry.type === type)?.value;
  return part(from, "month") === part(to, "month") ? `${part(from, "day")}–${dayMonth.format(to)}` : `${dayMonth.format(from)} – ${dayMonth.format(to)}`;
}
const keyOf = (path: SogpLearningPath | null): PathKey | null => path === "traditional" ? "sogp" : path === "doctrinal" ? "doctrinal" : path ? "podcast" : null;

/**
 * Choose a learning path (user and Pastor, 18–24 November). Three coloured
 * cards; tapping one opens its details in a panel under it (tap again to
 * close). The path saves on Continue, before any plan is built, and every
 * path ends on Learning. Existing learners still preview a switch first.
 */
export function PathChooser({ data }: { data: LearningViewData }) {
  const current = data.state?.revision ? data.state.path : null;
  const plan = data.state?.plan ?? null;
  const planHoldsTeachings = Boolean(plan && [...plan.episodeGuids, ...plan.historyEpisodeGuids].some(isTeachingKey));
  const [open, setOpen] = useState<PathKey | null>(keyOf(current));
  const [pace, setPace] = useState<1 | 2 | null>(current === "podcast_two" ? 2 : current === "podcast_one" ? 1 : null);
  const taught = data.traditional.levels.filter(level => level.tracks.length);
  const firstOpen = taught.find(level => level.open && level.done < level.tracks.length) ?? taught[0];
  const [level, setLevel] = useState<number>(firstOpen?.level ?? 1);
  // Read once when the chooser opens, so dates stay stable across renders.
  const [openedAt] = useState(() => Date.now());
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();
  const router = useRouter();
  const query = useQueryClient();

  const target: SogpLearningPath | null = open === "sogp" ? "traditional" : open === "doctrinal" ? "doctrinal" : open === "podcast" && pace ? pace === 2 ? "podcast_two" : "podcast_one" : null;
  const ready = target !== null && data.canWrite;

  function save(path: SogpLearningPath) {
    setError(null);
    startSave(async () => {
      try {
        const result = await chooseSogpPathAction({ path, expectedRevision: data.state?.revision ?? 0 });
        if (!result.ok) { setError(result.error); return; }
        query.setQueryData<LearningViewData>(["sogp", "learning-v3"], old => ({ ...(old ?? data), state: result.value }));
        // A plan path without its plan goes on to build it; everything else ends on Learning.
        router.push(isPlanPath(path) && !result.value.plan ? `/dashboard/sogp/plan?path=${path}` : "/dashboard/sogp");
        router.refresh();
      } catch { setError("Couldn’t save your path. Check your connection and try again; your previous choice is unchanged."); }
    });
  }

  function proceed() {
    if (!target) return;
    if (target === current) { router.push(isPlanPath(target) && !plan ? `/dashboard/sogp/plan?path=${target}` : "/dashboard/sogp"); return; }
    // Switching between saved plans previews what's kept first (Paper).
    const podcastSide = (path: SogpLearningPath) => path === "traditional" || path === "podcast_one" || path === "podcast_two";
    if (current && plan && !planHoldsTeachings && podcastSide(current) && podcastSide(target)) { setConfirming(true); return; }
    save(target);
  }

  if (confirming && target && current) {
    const props = { data, target, saving, error, onConfirm: () => save(target), onCancel: () => { setConfirming(false); setError(null); } };
    return current !== "traditional" && target !== "traditional" ? <PaceSwitchConfirm {...props} /> : <PathSwitchConfirm {...props} />;
  }

  const card = (key: PathKey, title: string, line: string, fact: string, body: ReactNode) => {
    const on = open === key;
    return <div className={styles.slot} data-tour-path={key}>
      <div className={styles.path} data-on={on} style={look(key)}>
        <button type="button" aria-pressed={on} aria-expanded={on} className={styles.head} onClick={() => { setOpen(on ? null : key); setError(null); }}>
          <span className={styles.art} aria-hidden="true" />
          <span className={styles.title}>{title}{keyOf(current) === key ? <span className={styles.current}>Current</span> : null}<span className={styles.check} aria-hidden="true"><CheckIcon className="size-3" strokeWidth={3} /></span></span>
          <span className={styles.line}>{line}</span>
          <span className={styles.fact}>{fact}</span>
        </button>
      </div>
      <div className={styles.more} data-open={on} inert={!on}><div className={styles.moreInner}><div className={styles.panel}>{body}</div></div></div>
    </div>;
  };

  // SOGP: the chosen level's tracks with their dates, then one line on what follows.
  const chosen = taught.find(entry => entry.level === level);
  const following = taught.filter(entry => entry.level > level);
  const lastRelease = [chosen, ...following].flatMap(entry => entry?.tracks ?? []).map(track => new Date(track.releaseAt).getTime()).sort((a, b) => b - a)[0];
  const trackCount = [chosen, ...following].reduce((sum, entry) => sum + (entry?.tracks.length ?? 0), 0);
  const locked = taught.find(entry => !entry.open);
  const levelFourSoon = !data.traditional.levels.find(entry => entry.level === 4)?.tracks.length;
  const sogpBody = taught.length ? <>
    <span className={styles.ask} id="start-level">Where are you starting?</span>
    <div role="radiogroup" aria-labelledby="start-level" className={styles.choices} data-count="3" data-tour="start-level">
      {taught.map(entry => <button key={entry.level} type="button" role="radio" aria-checked={level === entry.level} disabled={!entry.open} className={styles.choice} onClick={() => setLevel(entry.level)}>
        <strong>{!entry.open ? <LockIcon className="size-3" strokeWidth={2.2} aria-hidden="true" /> : null}Level {entry.level}</strong>
      </button>)}
    </div>
    {locked ? <p className={styles.levelMeta}>Each level opens once you’ve finished the one before it.</p> : null}
    {chosen ? <>
      <p className={styles.levelMeta}>{chosen.tracks.length} tracks · {dateRange(new Date(chosen.tracks[0]!.releaseAt), new Date(chosen.tracks.at(-1)!.releaseAt))}</p>
      <ol className={styles.tracks} data-tour="level-tracks">{chosen.tracks.map((track, index) => <li key={track.title + track.releaseAt}><span className={styles.no}>{index + 1}</span><span>{track.title}</span><span className={styles.date}>{dayMonth.format(new Date(track.releaseAt))}</span></li>)}</ol>
      <p className={styles.lede} data-tour="level-finish">
        {following.length ? <>Then {following.length > 1 ? "levels" : "level"} {following.map(entry => entry.level).join(" and ")}. </> : null}
        {lastRelease ? <>{trackCount} tracks done by <b>{longDate.format(new Date(lastRelease))}</b>. </> : null}
        {levelFourSoon ? "Level 4 is coming soon." : null}
      </p>
    </> : null}
  </> : <p className={styles.lede}>Your teachings open with your cohort, a track a day with a group review at the end of each level.</p>;

  const finishPodcast = (days: number) => longDate.format(new Date(openedAt + (days - 1) * 86_400_000));
  const podcastBody = <>
    <span className={styles.ask} id="pace">Choose your pace</span>
    <div role="radiogroup" aria-labelledby="pace" className={styles.choices} data-tour="pace">
      {([[1, "15 min a day", "1 episode"], [2, "30 min a day", "2 episodes"]] as const).map(([value, label, sub]) => <button key={value} type="button" role="radio" aria-checked={pace === value} className={styles.choice} onClick={() => { setPace(value); setError(null); }}><strong>{label}</strong><span>{sub}</span></button>)}
    </div>
    {pace ? <p className={styles.lede} data-tour="pace-finish">{pace * 30} episodes over 30 days, done by <b>{finishPodcast(30)}</b>. Then SOGP from level 1.</p> : null}
    {pace && planHoldsTeachings ? <p className={styles.lede}>Your doctrinal journey’s order is set aside. Your listens stay.</p> : null}
  </>;

  const doctrinalBody = <>
    <p className={styles.lede} data-tour="doctrinal-note">Choose a series or single teachings from the Library next. One a day, up to 120, and it counts toward your certificate.</p>
    {plan && !planHoldsTeachings && current !== "doctrinal" ? <p className={styles.lede}>Your podcast plan’s order is set aside. Your listens stay.</p> : null}
  </>;

  const action = !target ? "Continue" : target === current ? "Keep this path" : target === "traditional" ? `Start level ${level}` : target === "doctrinal" ? "Choose my teachings" : "Build my podcast plan";
  return <section className={`${learn.page} ${learn.choicePage}`}>
    <header className={learn.header}><h1>Choose a learning path</h1><p className={styles.lede}>{current ? "You keep everything you’ve done. Switching only changes what comes next" : "See where each one leads. You can change later"}</p></header>
    <div role="group" aria-label="Learning path" className={styles.paths} data-tour="paths">
      {card("sogp", "SOGP", "A teaching, quiz and written response each day", `1 hr a day · ${taught.length || 3} levels`, sogpBody)}
      {card("podcast", "Podcast", "Short episodes at your own pace", "15 or 30 min a day", podcastBody)}
      {card("doctrinal", "Choose doctrinal journey", "The doctrinal series you want, in your order", "One a day · up to 120", doctrinalBody)}
    </div>
    {!data.canWrite ? <p className={learn.muted}>{learningWriteNotice(data)}</p> : null}
    <div className={styles.footer}>
      {error ? <p role="alert" className={learn.error}>{error}</p> : null}
      {open === "podcast" && !pace ? <p className={styles.footNote}>Choose a pace to continue</p> : null}
      <button type="button" className={learn.primary} disabled={!ready || saving} onClick={proceed} data-tour="path-continue">{saving ? "Saving…" : action}<DashboardIcon name="right" size={16} /></button>
    </div>
  </section>;
}
