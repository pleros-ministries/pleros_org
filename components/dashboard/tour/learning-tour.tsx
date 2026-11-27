"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, HandIcon, XIcon } from "lucide-react";

import { saveLearningTourAction } from "@/app/_actions/learning-tour-actions";
import { resumeIndex, routeOf, syncToRoute, TOUR_ROUTES, tourSteps, type TourMode, type TourPath, type TourRoute, type TourStatus } from "@/lib/sogp/learning-tour";

import styles from "./learning-tour.module.css";

/** Profile's "Replay the tour" sends this; the tour starts again from the welcome. */
export const TOUR_REPLAY_EVENT = "pleros:tour-replay";

type Start = { resume: { step: string | null; path: TourPath | null; mode: TourMode | null } | null; firstName: string; leaderFirstName: string | null };
type State = { active: boolean; index: number; path: TourPath | null; mode: TourMode | null };
type Progress = { status: TourStatus; step: string | null; path: TourPath | null; mode: TourMode | null };
const saveProgress = (value: Progress) => { void saveLearningTourAction(value).catch(() => undefined); };

/**
 * The guided tour for new learners (user, 24 November; mockup
 * /preview/dashboard-v3/guided-tour). Spotlight coach-marks over the real
 * pages. Tap steps wait for the learner's own tap, and their taps do the real
 * thing (saving the path or plan); the tour follows to the next page. Progress
 * saves as they go so it resumes on any device; done or skipped, it stays away.
 * /demo passes its own pages and keeps progress in memory.
 */
export function LearningTour({ start, routes = TOUR_ROUTES, onSave = saveProgress, onFinish }: { start: Start; routes?: Record<TourRoute, string>; onSave?: (value: Progress) => void; onFinish?: (status: "done" | "skipped") => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const route = routeOf(pathname, routes);
  const names = useMemo(() => ({ firstName: start.firstName, leaderFirstName: start.leaderFirstName }), [start.firstName, start.leaderFirstName]);
  const [state, setState] = useState<State>(() => {
    const resume = start.resume;
    if (!resume) return { active: false, index: 0, path: null, mode: null };
    return { active: true, index: resumeIndex(tourSteps(resume.path, resume.mode, names), resume.step), path: resume.path, mode: resume.mode };
  });
  const steps = useMemo(() => tourSteps(state.path, state.mode, names), [state.path, state.mode, names]);
  // Their own taps can land them further on (keeping a path they already have
  // opens Learning straight away); the tour follows rather than waits.
  const index = state.active ? syncToRoute(steps, state.index, route) : state.index;
  const step = state.active ? steps[index] : undefined;
  // The spotlight and card size belong to one step; a stale one is ignored.
  const [measured, setMeasured] = useState<{ id: string; rect: DOMRect | null; missing: boolean; card: number } | null>(null);
  const current = measured && step && measured.id === step.id ? measured : null;
  const rect = current?.rect ?? null, missing = current?.missing ?? false, cardHeight = current?.card ?? 180;
  const cardRef = useRef<HTMLDivElement>(null);
  // Set after a tap that should change page; it no longer counts once the page has changed.
  const [tapped, setTapped] = useState<{ from: string; back: number } | null>(null);
  const awaiting = tapped && tapped.from === pathname ? tapped : null;

  const save = (status: TourStatus, value: { index: number; path: TourPath | null; mode: TourMode | null }) => {
    const id = tourSteps(value.path, value.mode, names)[value.index]?.id ?? null;
    onSave({ status, step: id, path: value.path, mode: value.mode });
  };

  const onPage = Boolean(step && step.route === route);
  const advance = () => setState(value => ({ ...value, index: syncToRoute(tourSteps(value.path, value.mode, names), value.index, route) + 1 }));
  const next = () => {
    const following = steps[index + 1];
    if (following && following.route !== route) router.push(routes[following.route]);
    advance();
  };
  // Effects call the latest save and advance through this, so they don't restart every render.
  const latest = useRef({ save, advance });
  useLayoutEffect(() => { latest.current = { save, advance }; });

  // Save the learner's place as they go (a moment after each change).
  useEffect(() => {
    if (!state.active) return;
    const timer = setTimeout(() => latest.current.save("active", { ...state, index }), 400);
    return () => clearTimeout(timer);
  }, [state, index]);

  // A tap that should have changed page but didn't (a save failed): step back so they aren't stranded.
  useEffect(() => {
    if (!awaiting) return;
    const timer = setTimeout(() => { setTapped(null); setState(value => ({ ...value, index: awaiting.back })); }, 8000);
    return () => clearTimeout(timer);
  }, [awaiting]);

  // Replay from Profile.
  useEffect(() => {
    const replay = () => { const fresh = { active: true, index: 0, path: null, mode: null }; setState(fresh); latest.current.save("active", fresh); router.push(routes.home); };
    window.addEventListener(TOUR_REPLAY_EVENT, replay);
    return () => window.removeEventListener(TOUR_REPLAY_EVENT, replay);
  }, [router, routes.home]);

  const back = () => setState(value => ({ ...value, index: Math.max(0, index - 1) }));
  const finish = (status: "done" | "skipped") => { save(status, { ...state, index }); setState(value => ({ ...value, active: false })); onFinish?.(status); };

  // Find the target, bring it into view, and follow it as the page moves.
  useLayoutEffect(() => {
    if (!step || !onPage || step.kind !== "spot") return;
    let frame = 0, scrolled = false, found: Element | null = null;
    const started = performance.now();
    const measure = () => {
      found = found?.isConnected ? found : document.querySelector(`[data-tour="${step.target}"]`);
      const card = cardRef.current?.offsetHeight ?? 180;
      if (found) {
        if (!scrolled) { found.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); scrolled = true; }
        setMeasured({ id: step.id, rect: found.getBoundingClientRect(), missing: false, card });
      } else if (performance.now() - started > 4000) {
        // Some targets only exist for some people (the leader banner, Home's days).
        if (step.optional) latest.current.advance(); else setMeasured({ id: step.id, rect: null, missing: true, card });
        return;
      }
      frame = requestAnimationFrame(measure);
    };
    frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [step, onPage]);

  // Tap steps: the tap does its real job; the tour moves on with it.
  useEffect(() => {
    if (!step || !onPage || step.advance === "next") return;
    const onClick = (event: MouseEvent) => {
      const target = step.target ? document.querySelector(`[data-tour="${step.target}"]`) : null;
      const clicked = event.target instanceof Element ? event.target : null;
      if (!target || !clicked || !target.contains(clicked)) return;
      if (step.id === "pick") {
        const picked = clicked.closest("[data-tour-path]")?.getAttribute("data-tour-path") as TourPath | null;
        if (!picked) return;
        setTimeout(() => setState(value => ({ ...value, path: picked, mode: null, index: index + 1 })), 420);
        return;
      }
      if (step.id === "tabs") {
        const mode = clicked.closest("[data-tour-mode]")?.getAttribute("data-tour-mode") as TourMode | null;
        if (!mode) return;
        setTimeout(() => setState(value => ({ ...value, mode, index: index + 1 })), 420);
        return;
      }
      if (step.id === "pace" && !clicked.closest('[role="radio"]')) return;
      if (step.advance === "tap-nav") { setTapped({ from: pathname, back: index }); latest.current.advance(); return; }
      setTimeout(() => latest.current.advance(), 420);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [step, onPage, pathname, index]);

  useEffect(() => {
    if (!step) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") finish("skipped"); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!step) return null;
  if (!onPage) {
    // Waiting for a page their tap is opening, or for them to reach Home after sign-up.
    if (awaiting || step.id === "welcome") return null;
    return <Link href={routes[step.route]} className={styles.pill}>Continue the tour<ArrowRightIcon className="size-3.5" strokeWidth={2.2} /></Link>;
  }

  const count = state.path ? (state.path === "podcast" && !state.mode ? tourSteps("podcast", "suggested", names).length : steps.length) : tourSteps("sogp", null, names).length;
  if (step.kind === "sheet") {
    const last = index === steps.length - 1;
    return <div className={styles.sheetBackdrop} role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className={styles.sheet}>
        <span className={styles.sheetHero} aria-hidden="true" />
        <h2 id="tour-title" className={styles.title}>{step.title}</h2>
        <p className={styles.body}>{step.body}</p>
        <div className={styles.sheetActions}>
          {last ? <button type="button" className={styles.primary} onClick={() => finish("done")} autoFocus>{state.path === "sogp" ? "Start today’s teaching" : "Listen to day 1"}<ArrowRightIcon className="size-4" strokeWidth={2.2} /></button>
            : <><button type="button" className={styles.primary} onClick={next} autoFocus>Show me<ArrowRightIcon className="size-4" strokeWidth={2.2} /></button>
              <button type="button" className={styles.quiet} onClick={() => finish("skipped")}>I’ll look around myself</button></>}
        </div>
      </div>
    </div>;
  }

  // Spotlights are measured in the browser; until then (and on the server) draw nothing.
  if (!current) return null;
  const pad = 8;
  const hole = rect ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : null;
  const vh = window.innerHeight;
  const below = hole ? hole.top + hole.height + 12 + cardHeight < vh - 8 : true;
  const cardTop = hole ? (below ? hole.top + hole.height + 12 : Math.max(8, hole.top - 12 - cardHeight)) : vh - cardHeight - 16;
  const tapping = step.advance !== "next";
  const previous = steps[index - 1];
  return <>
    {/* Four panes block the page around the hole; the hole stays tappable. */}
    {hole ? <>
      <div className={styles.block} style={{ top: 0, left: 0, right: 0, height: Math.max(0, hole.top) }} />
      <div className={styles.block} style={{ top: hole.top + hole.height, left: 0, right: 0, bottom: 0 }} />
      <div className={styles.block} style={{ top: hole.top, left: 0, width: Math.max(0, hole.left), height: hole.height }} />
      <div className={styles.block} style={{ top: hole.top, left: hole.left + hole.width, right: 0, height: hole.height }} />
      <div className={styles.spot} data-tap={tapping || undefined} style={{ transform: `translate(${hole.left}px, ${hole.top}px)`, width: hole.width, height: hole.height }} aria-hidden="true" />
    </> : missing ? <div className={styles.dim} /> : null}
    <div ref={cardRef} className={styles.card} role="dialog" aria-labelledby="tour-title" aria-live="polite" style={{ transform: `translateY(${cardTop}px)` }}>
      <div className={styles.cardHead}><span className={styles.count}>{index + 1} of {count}</span><button type="button" className={styles.skip} onClick={() => finish("skipped")} aria-label="Skip the tour"><XIcon className="size-4" strokeWidth={2.2} /></button></div>
      <h2 id="tour-title" className={styles.title}>{step.title}</h2>
      <p className={styles.body}>{missing ? `${step.body} If you can’t see it, tap Next or skip the tour.` : step.body}</p>
      <div className={styles.cardFoot}>
        {/* Back stays on this page; earlier pages already did their saving. */}
        {previous && previous.route === step.route && previous.kind === "spot" ? <button type="button" className={styles.quiet} onClick={back}><ArrowLeftIcon className="size-3.5" strokeWidth={2.2} />Back</button> : <span />}
        {tapping && !missing ? <span className={styles.tapHint}><HandIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />{step.tap}</span>
          : <button type="button" className={styles.next} onClick={next} autoFocus>Next<ArrowRightIcon className="size-3.5" strokeWidth={2.2} /></button>}
      </div>
    </div>
  </>;
}
