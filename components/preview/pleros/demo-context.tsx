"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { timeOfDayGreeting } from "@/lib/preview/pleros/greeting";
import { isDateKey } from "@/lib/community/ministry-report";
import { shiftDate } from "@/lib/sogp/daily-date";
import { DEFAULT_PERSON_ID, DEMO_STATE_VERSION, buildDemoState } from "@/lib/preview/pleros/fixtures";
import { findPerson } from "@/lib/preview/pleros/scope";
import type { DemoPerson, DemoState, Outcome } from "@/lib/preview/pleros/types";

/**
 * The demo's one source of truth: synthetic state held in this tab (and
 * mirrored to sessionStorage so a reload keeps it), the person being viewed
 * as (`?as=`) and the selected Lagos day (`?day=`). Nothing here calls a
 * server action, fetches, or writes anywhere but the browser tab.
 */

export const DEMO_BASE = "/preview/pleros";
/** How far back the trackers let a viewer look. Writes stay on today and the previous seven days. */
export const DEMO_HISTORY_DAYS = 20;

type Toast = { id: number; message: string; tone: "success" | "error" };

type DemoContextValue = {
  state: DemoState;
  today: string;
  greeting: string;
  viewer: DemoPerson;
  day: string;
  /** Applies a pure transition; shows its message and returns the outcome. */
  run: (transition: (state: DemoState) => Outcome) => Outcome;
  reset: () => void;
  /** A demo path that keeps the current person and day unless overridden. */
  href: (path: string, params?: Record<string, string | null | undefined>) => string;
  setDay: (day: string) => void;
  switchPerson: (personId: string, path?: string, params?: Record<string, string>) => void;
  toast: Toast | null;
  notify: (message: string, tone?: Toast["tone"]) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

function storageKey(today: string) {
  return `pleros-demo:v${DEMO_STATE_VERSION}:${today}`;
}

function readStored(today: string): DemoState | null {
  try {
    const raw = window.sessionStorage.getItem(storageKey(today));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DemoState;
    return parsed.version === DEMO_STATE_VERSION && parsed.today === today ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * A tiny external store, so the server renders the fixtures, the client
 * hydrates with them and then switches to the tab's saved copy.
 */
function createDemoStore(today: string) {
  const fixtures = buildDemoState(today);
  let current = fixtures;
  let restored = false;
  const listeners = new Set<() => void>();

  return {
    getServerSnapshot: () => fixtures,
    getSnapshot: () => {
      if (!restored) {
        restored = true;
        current = readStored(today) ?? current;
      }
      return current;
    },
    set(next: DemoState, persist = true) {
      current = next;
      if (persist) {
        try {
          window.sessionStorage.setItem(storageKey(today), JSON.stringify(next));
        } catch {
          // Storage full or blocked: the demo keeps working in memory.
        }
      }
      for (const listener of listeners) listener();
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function DemoProvider({ today, initialGreeting, children }: { today: string; initialGreeting: string; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [store] = useState(() => createDemoStore(today));
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
  const [toast, setToast] = useState<Toast | null>(null);
  const [greeting, setGreeting] = useState(initialGreeting);

  useEffect(() => {
    const update = () => setGreeting(timeOfDayGreeting(new Date()));
    const timer = window.setInterval(update, 60_000);
    window.addEventListener("focus", update);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", update);
    };
  }, []);


  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const viewerId = searchParams.get("as");
  const viewer =
    (viewerId && findPerson(state, viewerId)) || findPerson(state, DEFAULT_PERSON_ID)!;

  const requestedDay = searchParams.get("day");
  const earliest = shiftDate(today, -DEMO_HISTORY_DAYS);
  const day =
    requestedDay && isDateKey(requestedDay) && requestedDay <= today && requestedDay >= earliest
      ? requestedDay
      : today;

  function notify(message: string, tone: Toast["tone"] = "success") {
    setToast({ id: Date.now(), message, tone });
  }

  function run(transition: (current: DemoState) => Outcome) {
    const outcome = transition(store.getSnapshot());
    if (outcome.ok) {
      store.set(outcome.state);
      if (outcome.message) notify(outcome.message);
    } else {
      notify(outcome.error, "error");
    }
    return outcome;
  }

  function href(path: string, params: Record<string, string | null | undefined> = {}) {
    const query = new URLSearchParams();
    const as = params.as === undefined ? viewer.id : params.as;
    if (as && as !== DEFAULT_PERSON_ID) query.set("as", as);
    const nextDay = params.day === undefined ? day : params.day;
    if (nextDay && nextDay !== today) query.set("day", nextDay);
    for (const [key, value] of Object.entries(params)) {
      if (key === "as" || key === "day") continue;
      if (value) query.set(key, value);
    }
    const target = path.startsWith("/") ? path : `${DEMO_BASE}${path ? `/${path}` : ""}`;
    const search = query.toString();
    return search ? `${target}?${search}` : target;
  }

  function setDay(nextDay: string) {
    const query = new URLSearchParams(searchParams.toString());
    if (nextDay === today) query.delete("day");
    else query.set("day", nextDay);
    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }

  function switchPerson(personId: string, path?: string, params: Record<string, string> = {}) {
    const query = new URLSearchParams();
    if (personId !== DEFAULT_PERSON_ID) query.set("as", personId);
    if (day !== today) query.set("day", day);
    for (const [key, value] of Object.entries(params)) query.set(key, value);
    const search = query.toString();
    const target = path ?? pathname;
    router.push(search ? `${target}?${search}` : target, { scroll: false });
  }

  function reset() {
    try {
      window.sessionStorage.removeItem(storageKey(today));
    } catch {
      // Ignore: reset still restores the fixtures in memory.
    }
    store.set(buildDemoState(today), false);
    notify("Reset complete.");
  }

  return (
    <DemoContext.Provider
      value={{ state, today, greeting, viewer, day, run, reset, href, setDay, switchPerson, toast, notify }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo(): DemoContextValue {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside DemoProvider");
  return value;
}
