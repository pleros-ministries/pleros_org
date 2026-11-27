/**
 * The guided tour for new learners (user, 24 November; mockup
 * /preview/dashboard-v3/guided-tour). Spotlight steps over the real pages:
 * choosing a learning path, then the steps for whichever path they tap, then
 * Learning and Home. Steps find their targets by `data-tour` attributes.
 * Pure: no DOM, no database.
 */

export type TourPath = "sogp" | "podcast" | "doctrinal";
export type TourMode = "suggested" | "own";
export type TourStatus = "active" | "done" | "skipped";
/** The dashboard pages the tour visits. */
export type TourRoute = "home" | "choose" | "plan" | "learning";
export type TourAdvance = "next" | "tap" | "tap-nav";

export type TourStep = {
  id: string;
  route: TourRoute;
  kind: "sheet" | "spot";
  /** The `data-tour` value of the thing to spotlight. */
  target?: string;
  advance: TourAdvance;
  title: string;
  body: string;
  /** On tap steps, what to tap. */
  tap?: string;
  /** Skipped when its target never appears (the leader banner shows only after a link join). */
  optional?: boolean;
};

export type TourNames = { firstName: string; leaderFirstName: string | null };

export const TOUR_ROUTES: Record<TourRoute, string> = {
  home: "/dashboard",
  choose: "/dashboard/sogp/path",
  plan: "/dashboard/sogp/plan",
  learning: "/dashboard/sogp",
};

export function routeOf(pathname: string, routes: Record<TourRoute, string> = TOUR_ROUTES): TourRoute | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  return (Object.entries(routes) as Array<[TourRoute, string]>).find(([, href]) => href === path)?.[0] ?? null;
}

export function tourSteps(path: TourPath | null, mode: TourMode | null, names: TourNames): TourStep[] {
  const leader = names.leaderFirstName;
  const welcome: TourStep = { id: "welcome", route: "home", kind: "sheet", advance: "next", title: `Welcome to Pleros, ${names.firstName}`,
    body: leader ? `You joined ${leader}’s group. ${leader} leads your group and will walk with you. First, let’s set up how you’ll learn. It takes about a minute.` : "Let’s set up how you’ll learn. It takes about a minute, and you can change it later." };
  const common: TourStep[] = [
    welcome,
    { id: "start", route: "home", kind: "spot", target: "home-learning", advance: "tap-nav", title: "Start here", body: "Your learning lives in this card.", tap: "Tap Choose your SOGP path" },
    { id: "paths", route: "choose", kind: "spot", target: "paths", advance: "next", title: "Three ways through SOGP", body: "The doctrinal path is a track a day, with a quiz and a written response. Podcast is shorter episodes. A personalised path is teachings you pick from the Library." },
    { id: "pick", route: "choose", kind: "spot", target: "paths", advance: "tap", title: "Pick the one that fits your days", body: "Each one shows where it leads before you commit.", tap: "Tap a path" },
  ];
  if (!path) return common;
  const end: TourStep[] = [
    { id: "card", route: "learning", kind: "spot", target: "learning-card", advance: "next", title: path === "sogp" ? "Today’s teaching is here" : path === "podcast" ? "Your first episode is ready" : "Your first teaching is ready", body: path === "sogp" ? "Each day, open the next track from this card. Missed a day? It waits for you." : "Each day, listen from this card. Missed a day? It waits for you." },
    { id: "your-path", route: "learning", kind: "spot", target: "your-path", advance: "next", title: "Your path at a glance", body: "How much there is, how long is left, and when you’ll finish. Change path any time from here." },
    ...(leader ? [{ id: "leader", route: "learning" as const, kind: "spot" as const, target: "leader-banner", advance: "next" as const, optional: true, title: `${leader} looks after you`, body: `Keep ${leader} as your leader, or ask for someone else. Either way, nothing else changes.` }] : []),
    { id: "home-day", route: "home", kind: "spot", target: "home-today", advance: "next", optional: true, title: "Your day, on Home", body: path === "sogp" ? "Teaching, Prayer Watch and your assessment, ticked off as you go." : "Your listening and Prayer Watch, ticked off as you go." },
    { id: "done", route: "home", kind: "sheet", advance: "next", title: "You’re all set", body: path === "sogp" ? "Start today’s teaching whenever you’re ready. You can replay this tour from Profile." : path === "podcast" ? "Your first episode is waiting. You can replay this tour from Profile." : "Your first teaching is waiting. Add more from the Library any time. You can replay this tour from Profile." },
  ];
  const picker = (noun: string, unit: string): TourStep[] => [
    { id: "own-search", route: "plan", kind: "spot", target: "plan-search", advance: "next", title: `Find a ${noun}`, body: `Search by series or ${unit}.` },
    { id: "own-add", route: "plan", kind: "spot", target: "plan-add", advance: "tap", title: "Add a whole series", body: `Or open a series and tick single ${unit}s.`, tap: "Tap Add all" },
    { id: "own-tray", route: "plan", kind: "spot", target: "plan-tray", advance: "next", title: "Your plan so far", body: `How many ${unit}s you’ve picked, how many days that makes, and when you’ll finish.` },
    { id: "own-order", route: "plan", kind: "spot", target: "plan-review", advance: "tap", title: "Put them in order", body: "Add more any time first. When you’re happy, set the order.", tap: "Tap Put them in order" },
    { id: "own-move", route: "plan", kind: "spot", target: "plan-day", advance: "next", title: "Make the order yours", body: `Move any ${unit} earlier or later.` },
    { id: "own-start", route: "plan", kind: "spot", target: "plan-start", advance: "tap-nav", title: "Start", body: `You can still change your ${unit}s later.`, tap: "Tap Start my plan" },
  ];
  const branch: Record<TourPath, TourStep[]> = {
    sogp: [
      { id: "level", route: "choose", kind: "spot", target: "start-level", advance: "next", title: "Where you start", body: "New here? Start at level 1. Each level opens once you’ve finished the one before." },
      { id: "tracks", route: "choose", kind: "spot", target: "level-tracks", advance: "next", title: "Your first week", body: "Six tracks, one a day. Each has a short quiz and a written response, then a group review." },
      { id: "finish", route: "choose", kind: "spot", target: "level-finish", advance: "next", optional: true, title: "Where it leads", body: "See when you’d finish if you keep a track a day." },
      { id: "go", route: "choose", kind: "spot", target: "path-continue", advance: "tap-nav", title: "Ready when you are", body: "Your path saves now. You can change it later.", tap: "Tap Start level 1" },
    ],
    podcast: [
      { id: "pace", route: "choose", kind: "spot", target: "pace", advance: "tap", title: "Choose your pace", body: "15 minutes is one episode a day. 30 minutes is two.", tap: "Tap a pace" },
      { id: "finish", route: "choose", kind: "spot", target: "pace-finish", advance: "next", optional: true, title: "Where it leads", body: "Thirty episodes, then the doctrinal path from level 1." },
      { id: "go", route: "choose", kind: "spot", target: "path-continue", advance: "tap-nav", title: "Now your plan", body: "Your path saves now, so you won’t lose it.", tap: "Tap Build my podcast plan" },
      { id: "tabs", route: "plan", kind: "spot", target: "plan-tabs", advance: "tap", title: "Ours, or your own", body: "Take our suggested plan in one tap, or build your own from any series.", tap: "Tap one" },
      ...(mode === "own" ? picker("series", "episode") : [
        { id: "order", route: "plan" as const, kind: "spot" as const, target: "plan-order", advance: "next" as const, title: "What you’ll hear", body: "Each series in order, with the dates it falls on." },
        { id: "use", route: "plan" as const, kind: "spot" as const, target: "plan-use", advance: "tap-nav" as const, title: "Start listening", body: "You can still swap or reorder episodes later.", tap: "Tap Use this plan" },
      ]),
    ],
    doctrinal: [
      { id: "journey", route: "choose", kind: "spot", target: "doctrinal-note", advance: "next", title: "Your personalised path", body: "You’ll pick teachings from the Library, one a day. It counts toward your certificate." },
      { id: "go", route: "choose", kind: "spot", target: "path-continue", advance: "tap-nav", title: "Into the Library", body: "Your path saves now, so you won’t lose it.", tap: "Tap Choose my teachings" },
      ...picker("teaching", "teaching"),
    ],
  };
  return [...common, ...branch[path], ...end];
}

/** Where to pick up: the saved step, or the start when it's gone (renamed steps, a changed path). */
export function resumeIndex(steps: TourStep[], savedStep: string | null) {
  const index = savedStep ? steps.findIndex(step => step.id === savedStep) : -1;
  return index < 0 ? 0 : index;
}

/**
 * The learner's own taps can skip ahead (keeping a path they already have
 * lands straight on Learning). When they arrive on a page a later step
 * belongs to, the tour moves to that step instead of waiting.
 */
export function syncToRoute(steps: TourStep[], index: number, route: TourRoute | null) {
  const step = steps[index];
  if (!step || !route || step.route === route) return index;
  const ahead = steps.findIndex((candidate, at) => at > index && candidate.route === route);
  return ahead < 0 ? index : ahead;
}

/** Validates what the browser may save. */
export function tourInput(value: unknown): { status: TourStatus; step: string | null; path: TourPath | null; mode: TourMode | null } {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Check the tour progress.");
  const input = value as Record<string, unknown>;
  const status = input.status, step = input.step ?? null, path = input.path ?? null, mode = input.mode ?? null;
  if (status !== "active" && status !== "done" && status !== "skipped") throw new Error("Check the tour status.");
  if (step !== null && (typeof step !== "string" || !/^[a-z][a-z-]{0,39}$/.test(step))) throw new Error("Check the tour step.");
  if (path !== null && path !== "sogp" && path !== "podcast" && path !== "doctrinal") throw new Error("Check the tour path.");
  if (mode !== null && mode !== "suggested" && mode !== "own") throw new Error("Check the tour plan mode.");
  return { status, step: step as string | null, path: path as TourPath | null, mode: mode as TourMode | null };
}
