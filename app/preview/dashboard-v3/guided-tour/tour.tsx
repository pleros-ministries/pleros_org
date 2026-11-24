"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, HandIcon, XIcon } from "lucide-react";

import type { Screen } from "./screens";
import styles from "./tour.module.css";
import type { TourPath } from "./sample";

/**
 * Guided tour (user, 24 November): spotlight coach-marks over the real
 * screens. Some steps wait for the learner to tap the highlighted thing; the
 * steps after "pick a path" follow whichever path they tap. Mockup engine:
 * the real one keeps progress on the server and starts after sign-up.
 */

type Advance = "next" | "tap" | "tap-nav";
type Step = {
  id: string;
  screen: Screen;
  kind: "sheet" | "spot";
  find?: () => Element | null;
  title: string;
  body: string;
  advance: Advance;
  /** For tap-nav: where the tap takes them. */
  to?: Screen;
  /** Hint under the body on tap steps. */
  tap?: string;
  pad?: number;
};

const q = (selector: string) => () => document.querySelector(selector);
const byText = (selector: string, text: string) => () => [...document.querySelectorAll(selector)].find(node => node.textContent?.includes(text)) ?? null;
const footerButton = q('[class*="learning-paths-module"][class*="__footer"] button');

type PlanMode = "suggested" | "own";

function stepsFor(path: TourPath | null, arrival: "direct" | "link", mode: PlanMode | null = null): Step[] {
  const welcome: Step = arrival === "link"
    ? { id: "welcome", screen: "home", kind: "sheet", advance: "next", title: "Welcome to Pleros, Sam", body: "You joined Ada’s group. Ada leads your group and will walk with you. First, let’s set up how you’ll learn. It takes about a minute." }
    : { id: "welcome", screen: "home", kind: "sheet", advance: "next", title: "Welcome to Pleros, Sam", body: "Let’s set up how you’ll learn. It takes about a minute, and you can change it later." };
  const common: Step[] = [
    welcome,
    { id: "start", screen: "home", kind: "spot", find: byText("a", "Choose a learning path"), advance: "tap-nav", to: "choose", title: "Start here", body: "Your learning lives in this card.", tap: "Tap Choose a learning path" },
    { id: "paths", screen: "choose", kind: "spot", find: q('[aria-label="Learning path"]'), advance: "next", title: "Three ways to learn", body: "The doctrinal path is SOGP’s teachings, one a day. Podcast is shorter episodes. A personalised path is teachings you pick from the Library." },
    { id: "pick", screen: "choose", kind: "spot", find: q('[aria-label="Learning path"]'), advance: "tap", title: "Pick the one that fits your days", body: "Each one shows where it leads before you commit.", tap: "Tap a path" },
  ];
  if (!path) return common;
  const learning = `learning-${path}` as Screen, homeAfter = `home-${path}` as Screen;
  const end: Step[] = [
    { id: "card", screen: learning, kind: "spot", find: q('section[class*="learning-hub-module"][class*="__card"]'), advance: "next", title: path === "sogp" ? "Today’s teaching is here" : "Day 1 is ready", body: path === "sogp" ? "Each day, open the next track from this card. Missed a day? It waits for you." : "Each day, listen from this card. Missed a day? It waits for you." },
    { id: "your-path", screen: learning, kind: "spot", find: q('[class*="discipleship-group-module"][class*="__strip"]'), advance: "next", title: "Your path at a glance", body: "How much there is, how long is left, and when you’ll finish. Change path any time from here." },
    ...(arrival === "link" ? [{ id: "leader", screen: learning, kind: "spot" as const, find: byText("a", "invited you"), advance: "next" as const, title: "Ada looks after you", body: "Keep Ada as your leader, or ask for someone else. Either way, nothing else changes." }] : []),
    { id: "home-day", screen: homeAfter, kind: "spot", find: () => document.getElementById("home-today-heading")?.closest("section") ?? null, advance: "next", title: "Your day, on Home", body: path === "sogp" ? "Teaching, Prayer Watch and your assessment, ticked off as you go." : "Your listening and Prayer Watch, ticked off as you go." },
    { id: "done", screen: homeAfter, kind: "sheet", advance: "next", title: "You’re all set", body: path === "sogp" ? "Start today’s teaching whenever you’re ready. You can replay this tour from Profile." : path === "podcast" ? "Day 1 is waiting: two episodes, about 30 minutes. You can replay this tour from Profile." : "Your first teaching is waiting. Add more from the Library any time. You can replay this tour from Profile." },
  ];
  const branch: Record<TourPath, Step[]> = {
    sogp: [
      { id: "level", screen: "choose", kind: "spot", find: q('[aria-labelledby="start-level"]'), advance: "next", title: "Where you start", body: "New here? Start at level 1. Each level opens once you’ve finished the one before." },
      { id: "tracks", screen: "choose", kind: "spot", find: q('ol[class*="learning-paths-module"][class*="__tracks"]'), advance: "next", title: "Your first week", body: "Six tracks, one a day. Each has a short quiz and a written response, then a group review." },
      { id: "finish", screen: "choose", kind: "spot", find: byText("p", "tracks done by"), advance: "next", title: "Where it leads", body: "See when you’d finish if you keep a track a day." },
      { id: "go", screen: "choose", kind: "spot", find: footerButton, advance: "tap-nav", to: learning, title: "Ready when you are", body: "Your path saves now. You can change it later.", tap: "Tap Start level 1" },
    ],
    podcast: [
      { id: "pace", screen: "choose", kind: "spot", find: q('[aria-labelledby="pace"]'), advance: "tap", title: "Choose your pace", body: "15 minutes is one episode a day. 30 minutes is two.", tap: "Tap a pace" },
      { id: "finish", screen: "choose", kind: "spot", find: byText("p", "episodes over 30 days"), advance: "next", title: "Where it leads", body: "Thirty days of episodes, then SOGP from level 1." },
      { id: "go", screen: "choose", kind: "spot", find: footerButton, advance: "tap-nav", to: "plan-podcast", title: "Now your plan", body: "Your path saves now, so you won’t lose it.", tap: "Tap Build my podcast plan" },
      { id: "tabs", screen: "plan-podcast", kind: "spot", find: q('[role="tablist"][aria-label="Plan"]'), advance: "tap", title: "Ours, or your own", body: "Take our suggested plan in one tap, or build your own from any series.", tap: "Tap one" },
      // The steps after follow the tab they tap (user, 24 November: show Build my own too).
      ...(mode === "own" ? [
        { id: "own-search", screen: "plan-podcast", kind: "spot", find: q('label[class*="learning-paths-module"][class*="__search"]'), advance: "next", title: "Find a series", body: "Search by series or episode." },
        { id: "own-add", screen: "plan-podcast", kind: "spot", find: byText("button", "Add all"), advance: "tap", title: "Add a whole series", body: "Or open a series and tick single episodes.", tap: "Tap Add all" },
        { id: "own-tray", screen: "plan-podcast", kind: "spot", find: q('[class*="learning-paths-module"][class*="__tray"]'), advance: "next", title: "Your plan so far", body: "How many of your 60 episodes you’ve picked, and how many days that makes." },
        { id: "own-order", screen: "plan-podcast", kind: "spot", find: byText("button", "Put them in order"), advance: "tap", title: "Put them in order", body: "Add more any time first. When you’re happy, set the order.", tap: "Tap Put them in order" },
        { id: "own-move", screen: "plan-podcast", kind: "spot", find: q('[class*="learning-paths-module"][class*="__day"]'), advance: "next", title: "Make the order yours", body: "Two episodes a day. Move any episode earlier or later." },
        { id: "own-start", screen: "plan-podcast", kind: "spot", find: byText("button", "Start my plan"), advance: "tap-nav", to: learning, title: "Start listening", body: "You can still swap or reorder episodes later.", tap: "Tap Start my plan" },
      ] satisfies Step[] : [
        { id: "order", screen: "plan-podcast", kind: "spot", find: q('[class*="learning-paths-module"][class*="__box"]'), advance: "next", title: "What you’ll hear", body: "Each series in order, with the days it falls on." },
        { id: "use", screen: "plan-podcast", kind: "spot", find: byText("button", "Use this plan"), advance: "tap-nav", to: learning, title: "Start listening", body: "You can still swap or reorder episodes later.", tap: "Tap Use this plan" },
      ] satisfies Step[]),
    ],
    doctrinal: [
      { id: "journey", screen: "choose", kind: "spot", find: byText("p", "Choose a series or single teachings"), advance: "next", title: "Your personalised path", body: "You’ll pick teachings from the Library, one a day. It counts toward your certificate." },
      { id: "go", screen: "choose", kind: "spot", find: footerButton, advance: "tap-nav", to: "plan-doctrinal", title: "Into the Library", body: "Your path saves now, so you won’t lose it.", tap: "Tap Choose my teachings" },
      { id: "search", screen: "plan-doctrinal", kind: "spot", find: q('label[class*="learning-paths-module"][class*="__search"]'), advance: "next", title: "Find a teaching", body: "Search by title or series." },
      { id: "add", screen: "plan-doctrinal", kind: "spot", find: byText("button", "Add all"), advance: "tap", title: "Add a whole series", body: "Or open a series and tick single teachings.", tap: "Tap Add all" },
      { id: "tray", screen: "plan-doctrinal", kind: "spot", find: q('[class*="learning-paths-module"][class*="__tray"]'), advance: "next", title: "Your path so far", body: "How many teachings, how many days, and when you’ll finish." },
      { id: "order", screen: "plan-doctrinal", kind: "spot", find: byText("button", "Put them in order"), advance: "tap", title: "Put them in order", body: "One last look before you start.", tap: "Tap Put them in order" },
      { id: "move", screen: "plan-doctrinal", kind: "spot", find: q('[class*="learning-paths-module"][class*="__dayItem"]'), advance: "next", title: "Make the order yours", body: "Move any teaching earlier or later." },
      { id: "start-plan", screen: "plan-doctrinal", kind: "spot", find: byText("button", "Start my plan"), advance: "tap-nav", to: learning, title: "Start your path", body: "You can add more from the Library any time.", tap: "Tap Start my plan" },
    ],
  };
  return [...common, ...branch[path], ...end];
}

const PATH_OF: Array<[string, TourPath]> = [["Personalised path", "doctrinal"], ["Choose doctrinal journey", "doctrinal"], ["Podcast", "podcast"], ["Doctrinal path", "sogp"], ["SOGP", "sogp"]];

export function TourOverlay() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const screen = (params.get("screen") ?? "home") as Screen;
  const arrival = params.get("arrival") === "link" ? "link" : "direct";
  // Moving between screens is an in-page navigation, so this state carries across them.
  const [state, setState] = useState<{ index: number; path: TourPath | null; mode: PlanMode | null; closed: boolean }>(() => ({ index: 0, path: (params.get("path") as TourPath | null) ?? null, mode: null, closed: false }));
  const steps = useMemo(() => stepsFor(state.path, arrival, state.mode), [state.path, arrival, state.mode]);
  const step = steps[state.index];
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(180);
  const go = useCallback((screenTo: Screen) => router.push(`${pathname}?screen=${screenTo}&arrival=${arrival}`, { scroll: false }), [router, pathname, arrival]);
  const advance = useCallback(() => setState(current => ({ ...current, index: current.index + 1 })), []);
  // Next also moves to the following step's screen when it's on another one (Learning → Home).
  const next = useCallback(() => {
    const following = steps[state.index + 1];
    if (following && following.screen !== screen) go(following.screen);
    advance();
  }, [steps, state.index, screen, go, advance]);
  const back = () => setState(current => {
    const index = Math.max(0, current.index - 1), target = steps[index];
    if (target && target.screen !== screen) go(target.screen);
    return { ...current, index };
  });
  const close = () => setState(current => ({ ...current, closed: true }));

  // Find the target, bring it into view, and follow it while the page moves.
  useLayoutEffect(() => {
    if (!step || state.closed || step.kind !== "spot" || step.screen !== screen) { setRect(null); return; }
    let frame = 0, settled = 0, found: Element | null = null;
    const started = performance.now();
    const measure = () => {
      found = found?.isConnected ? found : step.find?.() ?? null;
      if (found) {
        if (!settled) { found.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); settled = performance.now(); }
        setRect(found.getBoundingClientRect());
      } else if (performance.now() - started > 4000) { setRect(null); return; }
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [step, screen, state.closed]);

  useLayoutEffect(() => { if (cardRef.current) setCardHeight(cardRef.current.offsetHeight); });

  // Tap steps: let the tap through to the page, then move on.
  useEffect(() => {
    if (!step || state.closed || (step.advance !== "tap" && step.advance !== "tap-nav")) return;
    const onClick = (event: MouseEvent) => {
      const target = step.find?.();
      if (!target || !(event.target instanceof Node) || !target.contains(event.target)) return;
      if (step.id === "pick") {
        const card = (event.target as Element).closest('[class*="__slot"]');
        const picked = PATH_OF.find(([label]) => card?.textContent?.includes(label))?.[1];
        if (!picked) return;
        setTimeout(() => setState(current => ({ ...current, path: picked, index: current.index + 1 })), 420);
        return;
      }
      if (step.id === "tabs") {
        const tab = (event.target as Element).closest('[role="tab"]');
        if (!tab) return;
        const mode: PlanMode = tab.textContent?.includes("Build my own") ? "own" : "suggested";
        setTimeout(() => setState(current => ({ ...current, mode, index: current.index + 1 })), 420);
        return;
      }
      if (step.id === "pace" && !(event.target as Element).closest('[role="radio"]')) return;
      if (step.advance === "tap-nav") {
        // The mockup never saves: the tap goes where the real button would.
        event.preventDefault(); event.stopPropagation();
        go(step.to!); advance();
        return;
      }
      setTimeout(advance, 420);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [step, state.closed, go, advance]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (state.closed || !step) return null;
  // Before a path is picked, count against the shortest branch; the total settles once they pick.
  const count = state.path ? (state.path === "podcast" && !state.mode ? stepsFor("podcast", arrival, "suggested").length : steps.length) : stepsFor("sogp", arrival).length;
  const progress = <span className={styles.count}>{state.index + 1} of {count}</span>;

  if (step.kind === "sheet") {
    const last = state.index === steps.length - 1;
    return <div className={styles.sheetBackdrop} role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className={styles.sheet} data-last={last || undefined}>
        {/* One strong image (user, 24 November): the staircase to the lit door, where learning starts. */}
        <span className={styles.sheetHero} aria-hidden="true" />
        <h2 id="tour-title" className={styles.title}>{step.title}</h2>
        <p className={styles.body}>{step.body}</p>
        <div className={styles.sheetActions}>
          {last ? <button type="button" className={styles.primary} onClick={close}>{state.path === "sogp" ? "Start today’s teaching" : "Listen to day 1"}<ArrowRightIcon className="size-4" strokeWidth={2.2} /></button>
            : <><button type="button" className={styles.primary} onClick={next}>Show me<ArrowRightIcon className="size-4" strokeWidth={2.2} /></button>
              <button type="button" className={styles.quiet} onClick={close}>I’ll look around myself</button></>}
        </div>
      </div>
    </div>;
  }

  const pad = step.pad ?? 8;
  const hole = rect ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : null;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const below = hole ? hole.top + hole.height + 12 + cardHeight < vh - 8 : true;
  const cardTop = hole ? (below ? hole.top + hole.height + 12 : Math.max(8, hole.top - 12 - cardHeight)) : vh - cardHeight - 16;
  const tapping = step.advance !== "next";
  return <>
    {/* Four panes block the page around the hole; the hole stays tappable. */}
    {hole ? <>
      <div className={styles.block} style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
      <div className={styles.block} style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
      <div className={styles.block} style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
      <div className={styles.block} style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
      <div className={styles.spot} data-tap={tapping || undefined} style={{ transform: `translate(${hole.left}px, ${hole.top}px)`, width: hole.width, height: hole.height }} aria-hidden="true" />
    </> : <div className={styles.dim} />}
    <div ref={cardRef} className={styles.card} role="dialog" aria-labelledby="tour-title" aria-live="polite" style={{ transform: `translateY(${cardTop}px)` }}>
      <div className={styles.cardHead}>{progress}<button type="button" className={styles.skip} onClick={close} aria-label="Skip the tour"><XIcon className="size-4" strokeWidth={2.2} /></button></div>
      <h2 id="tour-title" className={styles.title}>{step.title}</h2>
      <p className={styles.body}>{step.body}</p>
      <div className={styles.cardFoot}>
        {state.index > 0 ? <button type="button" className={styles.quiet} onClick={back}><ArrowLeftIcon className="size-3.5" strokeWidth={2.2} />Back</button> : <span />}
        {tapping ? <span className={styles.tapHint}><HandIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />{step.tap}</span>
          : <button type="button" className={styles.next} onClick={next} autoFocus>Next<ArrowRightIcon className="size-3.5" strokeWidth={2.2} /></button>}
      </div>
    </div>
  </>;
}
