import { HUB, home, learningView, type Arrival } from "@/app/preview/dashboard-v3/guided-tour/sample";
import type { DashboardHomeData } from "@/lib/dashboard/home";
import type { SogpLearningState } from "@/lib/db/queries/sogp-learning";
import { isPlanPath, isTeachingKey, type SogpLearningPath } from "@/lib/sogp/learning-input";
import { tourSteps, type TourMode, type TourPath, type TourRoute, type TourStep } from "@/lib/sogp/learning-tour";
import type { LearningViewData } from "@/lib/sogp/learning-view";
import { createPodcastPlan } from "@/lib/sogp/podcast-plan";

/**
 * The demo's sample learner (generic names only) and the rules for jumping
 * into the tour part-way: what they must already have saved, and what they
 * must already have tapped, for that step's screen to look right.
 */
export type { Arrival };

export const DEMO_ROUTES: Record<TourRoute, string> = { home: "/demo", choose: "/demo/sogp/path", plan: "/demo/sogp/plan", learning: "/demo/sogp" };
export const DEMO_NAME = "Sam";
export const demoNames = (arrival: Arrival) => ({ firstName: DEMO_NAME, leaderFirstName: arrival === "link" ? "Ada" : null });

/** Dashboard hrefs the demo has; anything else stays in the real app. */
export function demoHref(href: string): string | null {
  const path = href.split(/[?#]/)[0]!.replace(/\/+$/, "");
  if (path === "/dashboard") return DEMO_ROUTES.home;
  if (path === "/dashboard/sogp/path") return DEMO_ROUTES.choose;
  if (path === "/dashboard/sogp/plan") return DEMO_ROUTES.plan;
  if (path === "/dashboard/sogp") return DEMO_ROUTES.learning;
  return null;
}

export const tourPathOf = (path: SogpLearningPath | null | undefined): TourPath | null =>
  path === "traditional" ? "sogp" : path === "doctrinal" ? "doctrinal" : path ? "podcast" : null;

export function demoLearning(arrival: Arrival, state: SogpLearningState | null): LearningViewData {
  return { ...learningView(arrival), state };
}

/** Home shows the path's day once it's ready to start; before that, the card that opens the chooser. */
export function demoHome(state: SogpLearningState | null): DashboardHomeData {
  const ready = state && (state.path === "traditional" || state.plan) ? tourPathOf(state.path) : null;
  const data = home(ready);
  return ready ? data : { ...data, card: { kind: "start", href: "/dashboard/sogp/path" } };
}

export function demoHub(state: SogpLearningState | null) {
  const path = state && (state.path === "traditional" || state.plan) ? tourPathOf(state.path) : null;
  return HUB[path ?? "none"];
}

const empty = { listenedEpisodeGuids: [], playbackPositions: [] };

/** What saving a path (and maybe its plan) does, in memory. */
export function savePath(current: SogpLearningState | null, path: SogpLearningPath, episodeGuids?: string[]): SogpLearningState {
  const pace = path === "podcast_two" ? 2 : 1;
  const keep = current?.plan && current.path === path ? current.plan : null;
  return { path, revision: (current?.revision ?? 0) + 1, plan: episodeGuids ? createPodcastPlan(episodeGuids, pace) : isPlanPath(path) ? keep : null, progress: current?.progress ?? empty };
}

/** The suggested plan, as "Use this plan" would save it. */
function readyPlan(arrival: Arrival, path: TourPath) {
  const items = learningView(arrival).episodes;
  return path === "doctrinal" ? items.filter(item => isTeachingKey(item.guid)).slice(0, 5).map(item => item.guid)
    : items.filter(item => !isTeachingKey(item.guid)).slice(0, 60).map(item => item.guid);
}

export type Jump = { path: TourPath | null; mode: TourMode | null; step: TourStep; state: SogpLearningState | null; prime: string[] };

/** Everything a jump to `id` needs: the saved state behind it and the taps that lead to it. */
export function jumpTo(arrival: Arrival, path: TourPath | null, mode: TourMode | null, id: string): Jump {
  const steps = tourSteps(path, path === "podcast" ? mode : null, demoNames(arrival));
  const index = Math.max(0, steps.findIndex(step => step.id === id));
  const step = steps[index]!;
  const go = steps.findIndex(entry => entry.id === "go");
  const saved: SogpLearningPath | null = path === "sogp" ? "traditional" : path === "podcast" ? "podcast_two" : path === "doctrinal" ? "doctrinal" : null;
  const before = !path || go < 0 || index <= go;
  const state = before || !saved ? null
    : step.route === "plan" ? savePath(null, saved)
    : savePath(null, saved, path === "sogp" ? undefined : readyPlan(arrival, path));
  const prime: string[] = [];
  if (step.route === "choose" && path && index > steps.findIndex(entry => entry.id === "pick")) {
    prime.push(`[data-tour-path="${path}"] button[aria-expanded]`);
    if (path === "podcast" && step.id !== "pace") prime.push('[data-tour="pace"] [role="radio"]:last-of-type');
  }
  if (step.route === "plan") {
    if (path === "podcast" && step.id !== "tabs") prime.push(`[data-tour-mode="${mode === "own" ? "own" : "suggested"}"]`);
    if (["own-tray", "own-order", "own-move", "own-start"].includes(step.id)) prime.push('[data-tour="plan-add"]');
    if (["own-move", "own-start"].includes(step.id)) prime.push('[data-tour="plan-review"]');
  }
  return { path, mode: path === "podcast" ? mode : null, step, state, prime };
}
