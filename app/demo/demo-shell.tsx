"use client";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CompassIcon, RotateCcwIcon, XIcon } from "lucide-react";

import { LearningTour } from "@/components/dashboard/tour/learning-tour";
import { LearningWritesProvider, type LearningWrites } from "@/components/sogp/learning/learning-writes";
import type { SogpLearningState } from "@/lib/db/queries/sogp-learning";
import { tourSteps, type TourMode, type TourPath } from "@/lib/sogp/learning-tour";
import { createPodcastPlan } from "@/lib/sogp/podcast-plan";

import { DEMO_ROUTES, demoHref, demoNames, jumpTo, savePath, type Arrival } from "./demo-data";
import styles from "./demo.module.css";

type Demo = { arrival: Arrival; state: SogpLearningState | null };
const DemoContext = createContext<Demo>({ arrival: "direct", state: null });
export const useDemo = () => useContext(DemoContext);

type Tour = { key: number; arrival: Arrival; resume: { step: string | null; path: TourPath | null; mode: TourMode | null } };
type ChooseResult = Awaited<ReturnType<LearningWrites["choosePath"]>>;
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const PATHS: Array<[TourPath, string]> = [["sogp", "Doctrinal"], ["podcast", "Podcast"], ["doctrinal", "Personalised"]];

/**
 * /demo (user, 27 November): the newcomer's guided tour over the real screens
 * on sample data, for showing without an account. Saves stay in memory, links
 * to the tour's pages stay in the demo, and "Jump to a step" opens it anywhere.
 */
export function DemoShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [client] = useState(() => new QueryClient());
  const [arrival, setArrival] = useState<Arrival>("direct");
  const [state, setState] = useState<SogpLearningState | null>(null);
  const [tour, setTour] = useState<Tour>({ key: 0, arrival: "direct", resume: { step: null, path: null, mode: null } });
  const [prime, setPrime] = useState<{ route: string; selectors: string[] } | null>(null);
  const [picking, setPicking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // The in-memory "server" reads the latest state, not the one its closure saw.
  const current = useRef(state);
  const commit = (next: SogpLearningState | null) => { current.current = next; setState(next); };

  const writes = useMemo<LearningWrites>(() => ({
    choosePath: async input => {
      await pause(350);
      const { path, episodeGuids } = input as { path: SogpLearningState["path"]; episodeGuids?: string[] };
      const next = savePath(current.current, path, episodeGuids);
      commit(next);
      return { ok: true, value: next } as ChooseResult;
    },
    editPlan: async input => {
      await pause(350);
      const saved = current.current;
      if (!saved) return { ok: false, error: "Choose a path first." } as ChooseResult;
      const { episodeGuids } = input as { episodeGuids: string[] };
      const next = { ...saved, revision: saved.revision + 1, plan: createPodcastPlan(episodeGuids, saved.path === "podcast_two" ? 2 : 1) };
      commit(next);
      return { ok: true, value: next } as ChooseResult;
    },
    href: path => demoHref(path) ?? DEMO_ROUTES.learning,
  }), []);

  function jump(nextArrival: Arrival, path: TourPath | null, mode: TourMode | null, id: string) {
    const target = jumpTo(nextArrival, path, mode, id);
    setArrival(nextArrival);
    commit(target.state);
    const route = DEMO_ROUTES[target.step.route];
    setTour(value => ({ key: value.key + 1, arrival: nextArrival, resume: { step: id, path: target.path, mode: target.mode } }));
    setPrime(target.prime.length ? { route, selectors: target.prime } : null);
    setPicking(false);
    window.scrollTo(0, 0);
    if (pathname !== route) router.push(route);
  }

  // A jump part-way in makes the taps that lead there (open the card, pick a pace, add a series).
  useEffect(() => {
    if (!prime || pathname !== prime.route) return;
    let cancelled = false;
    void (async () => {
      for (const selector of prime.selectors) {
        let element: HTMLElement | null = null;
        for (let tries = 0; tries < 40 && !element && !cancelled; tries++) { element = document.querySelector<HTMLElement>(selector); if (!element) await pause(50); }
        if (cancelled) return;
        element?.click();
        await pause(320);
      }
      if (!cancelled) setPrime(null);
    })();
    return () => { cancelled = true; };
  }, [prime, pathname]);

  // Nothing leaves the browser. Someone signed in to Pleros who opens the demo
  // must not tick their own Prayer Watch or teaching: the screens' own saves
  // (Home's ticks, any server action) get a quiet "saved" here instead.
  useLayoutEffect(() => {
    const real = window.fetch;
    window.fetch = (input, init) => {
      const url = new URL(input instanceof Request ? input.url : String(input), location.href);
      const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
      if (url.origin !== location.origin || method === "GET" || method === "HEAD") return real(input, init);
      const action = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined)).has("next-action");
      if (action) return Promise.reject(new Error("Nothing is saved in the demo."));
      return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } }));
    };
    return () => { window.fetch = real; };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 2600);
    return () => clearTimeout(timer);
  }, [notice]);

  // The real screens link into the dashboard; the tour's own pages stay here.
  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!anchor || anchor.target === "_blank" || anchor.closest("[data-demo-bar]")) return;
    const href = anchor.getAttribute("href") ?? "";
    if (href === "#" || href.startsWith("?")) { event.preventDefault(); return; }
    if (!href.startsWith("/dashboard")) return;
    event.preventDefault();
    event.stopPropagation();
    const mapped = demoHref(href);
    if (mapped) router.push(mapped); else setNotice("That opens in the real app, not the demo");
  }

  return <QueryClientProvider client={client}>
    <LearningWritesProvider value={writes}>
      <DemoContext.Provider value={{ arrival, state }}>
        <div className={styles.bar} data-demo-bar>
          <span className={styles.label}>Demo · nothing saved</span>
          <button type="button" className={styles.barButton} onClick={() => setPicking(true)}><CompassIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />Jump to a step</button>
        </div>
        {notice ? <p className={styles.notice} role="status">{notice}</p> : null}
        <div onClickCapture={onClickCapture}>{children}</div>
        <LearningTour key={tour.key} start={{ resume: tour.resume, ...demoNames(tour.arrival) }} routes={DEMO_ROUTES} onSave={() => undefined} />
        {picking ? <Picker arrival={arrival} onJump={jump} onClose={() => setPicking(false)} /> : null}
      </DemoContext.Provider>
    </LearningWritesProvider>
  </QueryClientProvider>;
}

/** Choose how they arrived, which path, and the step to open at. */
function Picker({ arrival: initial, onJump, onClose }: { arrival: Arrival; onJump: (arrival: Arrival, path: TourPath | null, mode: TourMode | null, id: string) => void; onClose: () => void }) {
  const [arrival, setArrival] = useState<Arrival>(initial);
  const [path, setPath] = useState<TourPath>("sogp");
  const [mode, setMode] = useState<TourMode>("suggested");
  const steps = tourSteps(path, path === "podcast" ? mode : null, demoNames(arrival));
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const segmented = <T extends string>(label: string, value: T, options: Array<[T, string]>, set: (value: T) => void) =>
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map(([key, text]) => <button key={key} type="button" role="radio" aria-checked={value === key} onClick={() => set(key)}>{text}</button>)}
    </div>;
  return <div className={styles.backdrop} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="demo-picker-title">
      <div className={styles.sheetHead}>
        <h2 id="demo-picker-title">Jump to a step</h2>
        <button type="button" className={styles.close} onClick={onClose} aria-label="Close"><XIcon className="size-4" strokeWidth={2.2} /></button>
      </div>
      <span className={styles.ask}>How they arrived</span>
      {segmented("How they arrived", arrival, [["direct", "Signed up"], ["link", "Group link"]], setArrival)}
      <span className={styles.ask}>Path</span>
      {segmented("Path", path, PATHS, setPath)}
      {path === "podcast" ? <>
        <span className={styles.ask}>Plan</span>
        {segmented("Plan", mode, [["suggested", "Suggested plan"], ["own", "Build my own"]], setMode)}
      </> : null}
      <span className={styles.ask}>Open at</span>
      <ol className={styles.steps}>
        {steps.map((step, index) => <li key={step.id}>
          <button type="button" onClick={() => onJump(arrival, index < 4 ? null : path, index < 4 ? null : mode, step.id)}>
            <span className={styles.no}>{index + 1}</span><span>{step.title}</span><span className={styles.where}>{PAGE[step.route]}</span>
          </button>
        </li>)}
      </ol>
      <button type="button" className={styles.restart} onClick={() => onJump(arrival, null, null, "welcome")}><RotateCcwIcon className="size-3.5" strokeWidth={2.2} aria-hidden="true" />Start over from the welcome</button>
    </div>
  </div>;
}

const PAGE = { home: "Home", choose: "Choose a path", plan: "Plan", learning: "Learning" } as const;
