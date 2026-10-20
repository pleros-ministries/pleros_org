"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { flushSync, useFormStatus } from "react-dom";
import { motion } from "motion/react";
import { LoaderCircleIcon, LogOutIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from "lucide-react";

import { signOutDashboardAction } from "@/app/_actions/auth-actions";
import DashboardLoading from "@/app/(site)/dashboard/loading";
import { NotificationBell } from "@/components/community/notification-bell";
import { DashboardIcon, RootHeader } from "@/components/dashboard/v3/primitives";
import { dashboardFont, dashboardHeadingFont } from "@/components/dashboard/v3/font";
import { useTabSwipe } from "@/components/dashboard/v3/use-tab-swipe";
import v3 from "@/components/dashboard/v3/dashboard.module.css";
import type { DashboardNavSection } from "@/lib/dashboard/navigation";
import { dashboardAreaForPath, dashboardFocusForPath, dashboardAreaHref } from "@/lib/dashboard/shell-navigation";
import type { DashboardArea } from "@/lib/dashboard/swipe-tabs";
import { cn } from "@/lib/utils";

import { DashboardMenuNavigation } from "./dashboard-menu-navigation";
import frame from "./dashboard-shell.module.css";
import { compactButton, focusRing } from "./styles";
import { Breadcrumbs, CrumbLabelProvider } from "./breadcrumbs";
import { YouBottomBar } from "./you-bottom-bar";
import { GetAppButton } from "@/components/pwa/get-app-button";

export type DashboardShellViewer = { name: string; roleLabel: string; image?: string | null };

let mountedFrames = 0;
let previousFonts: string[] = [];
let previousDashboardAttribute: string | null = null;

function scopeDocumentTypography() {
  const root = document.documentElement;
  const keys = ["--font-be-vietnam-pro", "--font-sen", "--font-suisse-intl"];
  if (mountedFrames++ === 0) {
    previousFonts = keys.map(key => root.style.getPropertyValue(key));
    previousDashboardAttribute = root.getAttribute("data-pleros-dashboard");
    root.style.setProperty("--font-be-vietnam-pro", dashboardFont.style.fontFamily);
    keys.slice(1).forEach(key => root.style.setProperty(key, "var(--font-be-vietnam-pro)"));
    root.setAttribute("data-pleros-dashboard", "true");
  }
  return () => {
    if (--mountedFrames > 0) return;
    keys.forEach((key, index) => {
      if (previousFonts[index]) root.style.setProperty(key, previousFonts[index]);
      else root.style.removeProperty(key);
    });
    if (previousDashboardAttribute === null) root.removeAttribute("data-pleros-dashboard");
    else root.setAttribute("data-pleros-dashboard", previousDashboardAttribute);
  };
}

const COLLAPSED_KEY = "pleros-sidebar-collapsed";
const REMEMBERED_KEY = "pleros-area-positions";
/** The sidebar fold: 240ms on the drawer curve, closing 256px down to the 72px rail. */
const SIDEBAR_MS = 240;
const SIDEBAR_EASE = "cubic-bezier(0.32, 0.72, 0, 1)";
const RAIL_SHIFT = 256 - 72;
/** The right inset of a computed `inset(...)` clip-path, in px (0 for none). */
function clipRight(value: string) {
  const parts = /inset\(([^)]*)\)/.exec(value)?.[1].trim().split(/\s+/) ?? [];
  return parseFloat(parts[1] ?? parts[0] ?? "0") || 0;
}
/** The horizontal translation of a computed transform, in px. */
function shiftX(value: string) {
  return value === "none" ? 0 : new DOMMatrixReadOnly(value).m41;
}
type SidebarPhase = "open" | "folding" | "rail" | "unfolding";
/** Matches the drawer exit animation in dashboard-shell.module.css. */
const DRAWER_EXIT_MS = 200;

/** The Pleros logomark on a brand-blue strip, level with the blue top bar. */
function Brand({ collapsed = false, onToggle }: { collapsed?: boolean; onToggle?: () => void }) {
  return <div className={frame.brand} data-collapsed={collapsed || undefined}>
    <Link href="/dashboard" aria-label="Pleros home" className={frame.brandLink}>
      <Image src="/site/home/assets/white-pleros-logomark.webp" alt="Pleros" width={2067} height={1016} className={frame.brandMark} priority />
    </Link>
    {onToggle ? <button type="button" className={frame.collapseButton} data-sidebar-toggle onClick={onToggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-pressed={collapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
      {collapsed ? <PanelLeftOpenIcon className="size-[18px]" strokeWidth={1.9} /> : <PanelLeftCloseIcon className="size-[18px]" strokeWidth={1.9} />}
    </button> : null}
  </div>;
}

function Profile({ viewer, onNavigate, compact = false }: { viewer: DashboardShellViewer; onNavigate?: () => void; compact?: boolean }) {
  const initials = viewer.name.trim().split(/\s+/).map(part => part[0] ?? "").join("").slice(0, 2).toUpperCase();
  if (compact) return <Link href="/dashboard/profile" className={frame.railProfile} aria-label="Profile and settings" title="Profile and settings">
    <span className={v3.profileAvatar} aria-hidden>
      {viewer.image ? <Image src={viewer.image} alt="" width={36} height={36} unoptimized className="size-9 rounded-full object-cover" /> : initials}
    </span>
  </Link>;
  return <Link href="/dashboard/profile" onClick={onNavigate} className={v3.profileLink} aria-label="Profile and settings">
    <span className={v3.profileAvatar} aria-hidden>
      {viewer.image ? <Image src={viewer.image} alt="" width={36} height={36} unoptimized className="size-9 rounded-full object-cover" /> : initials}
    </span>
    <span className={v3.rowCopy}>
      <span className={v3.profileName}>{viewer.name || "Your profile"}</span>
      <span className={v3.profileAction}>Profile & settings</span>
    </span>
    <DashboardIcon name="right" size={16} />
  </Link>;
}

function SignOutSubmit({ compact = false }: { compact?: boolean }) {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} aria-busy={pending} aria-label={compact ? "Sign out" : undefined} title={compact ? "Sign out" : undefined} className={cn(compactButton, "flex-1")}>
    {pending ? <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden /> : <LogOutIcon className="size-3.5" aria-hidden />}
    {compact ? null : pending ? "Signing out" : "Sign out"}
  </button>;
}

function AccountActions({ compact = false }: { compact?: boolean }) {
  return <div className={frame.accountActions} style={compact ? undefined : { flexWrap: "wrap" }}>
    {/* Download Pleros, always to hand but quiet (Pastor, 20 October); hidden once installed. */}
    {compact ? null : <GetAppButton tone="quiet" className="w-full" />}
    {/* Full reload after sign-out so no preserved page state survives for the next person. */}
    <form action={async () => { await signOutDashboardAction(); window.location.assign("/login"); }} className="flex flex-1"><SignOutSubmit compact={compact} /></form>
  </div>;
}

function ShellNavigation({ sections, area, onArea, onNavigate, collapsed }: {
  sections: DashboardNavSection[]; area: DashboardArea;
  onArea: (next: DashboardArea, animated?: boolean) => void; onNavigate?: () => void; collapsed?: boolean;
}) {
  return <DashboardMenuNavigation sections={sections} area={area} onArea={onArea} onNavigate={onNavigate} collapsed={collapsed} />;
}

function Drawer({ open, onClose, viewer, sections, area, onArea, id }: {
  open: boolean; onClose: () => void; viewer: DashboardShellViewer; sections: DashboardNavSection[];
  area: DashboardArea; onArea: (next: DashboardArea, animated?: boolean) => void; id: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open) {
      delete dialog.dataset.closing;
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;
    // Hold the dialog open while it slides back out (DRAWER_EXIT_MS matches the CSS).
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { dialog.close(); return; }
    dialog.dataset.closing = "";
    const timer = window.setTimeout(() => { delete dialog.dataset.closing; dialog.close(); }, DRAWER_EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open]);
  return <dialog id={id} ref={ref} aria-labelledby={titleId} onClose={onClose}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    className={cn(v3.dialog, v3.drawer, frame.liveDrawer)}>
    <div className={cn(v3.dialogHeading, frame.drawerHeading)}>
      <h2 id={titleId} data-dashboard-shell-title className={frame.drawerTitle}><Image src="/site/home/assets/white-pleros-logomark.webp" alt="Pleros menu" width={2067} height={1016} className={frame.brandMark} /></h2>
      <button className={v3.iconButton} onClick={onClose} aria-label="Close navigation"><DashboardIcon name="close" /></button>
    </div>
    <Profile viewer={viewer} onNavigate={onClose} />
    <ShellNavigation sections={sections} area={area} onArea={onArea} onNavigate={onClose} />
    <div className={frame.drawerAccount}><AccountActions /></div>
  </dialog>;
}

/** Shared authenticated frame. Its props come from getDashboardViewer(); pages
 * remain their original server-rendered children with their own access guards. */
export function DashboardShell({ viewer, sections, children, notificationControl }: {
  viewer: DashboardShellViewer; sections: DashboardNavSection[]; children: ReactNode;
  /** Pure notification slot for isolated visual tests; live callers omit it. */
  notificationControl?: ReactNode;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const router = useRouter();
  const routedArea = dashboardAreaForPath(pathname);
  // Deep screens get "← Title" pointing at their true parent (one map in lib/dashboard/shell-navigation.ts).
  const focus = dashboardFocusForPath(pathname);
  const focusedLearning = focus?.title;
  const [menu, setMenu] = useState<{ open: boolean; pathname: string | null }>({ open: false, pathname: null });
  const [target, setTarget] = useState<{ from: string; area: DashboardArea } | null>(null);
  // Transition state coordinates motion only. Next's existing Suspense/loading
  // boundaries and page error boundaries continue to own route data states.
  const [navigating, startNavigation] = useTransition();
  const area = navigating && target?.from === pathname ? target.area : routedArea;
  const remembered = useRef<Record<DashboardArea, string>>({ you: "/dashboard", community: "/dashboard/community" });
  const scrollPositions = useRef(new Map<string, number>());
  const restoreScroll = useRef<string | null>(null);
  const drawerId = useId();
  const menuOpen = menu.open && menu.pathname === pathname;
  const closeMenu = () => setMenu({ open: false, pathname: null });
  const navigateArea = (next: DashboardArea) => {
    const currentHref = window.location.pathname + window.location.search;
    remembered.current[routedArea] = currentHref;
    scrollPositions.current.set(currentHref, document.scrollingElement?.scrollTop ?? 0);
    const href = dashboardAreaHref(next, sections, remembered.current[next]);
    if (!href || next === routedArea && !navigating) return false;
    restoreScroll.current = href;
    setTarget({ from: pathname, area: next });
    startNavigation(() => router.push(href, { scroll: false }));
    return true;
  };
  const { handlers: swipeHandlers, viewportRef, trackStyle, selectTab } = useTabSwipe(area, navigateArea, routedArea);
  const selectRootTab = (next: DashboardArea, animated = true) => {
    if (next === routedArea && !navigating) {
      const href = dashboardAreaHref(next, sections);
      if (href && pathname !== href) router.push(href);
      else if (href) document.scrollingElement?.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    selectTab(next, animated);
  };
  useEffect(scopeDocumentTypography, []);
  // Each area remembers where you were (user request, 18 October): swiping or tapping across
  // returns you to that page, not the area's home. Kept for the browser session.
  useEffect(() => {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(REMEMBERED_KEY) ?? "{}") as Partial<Record<DashboardArea, string>>;
      (["you", "community"] as const).forEach(key => {
        const href = saved[key];
        if (href && key !== routedArea && dashboardAreaHref(key, sections, href) === href) remembered.current[key] = href;
      });
    } catch { /* storage blocked: memory lasts until reload */ }
    // Read once on mount; later visits are recorded below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const href = window.location.pathname + window.location.search;
    remembered.current[routedArea] = href;
    try { window.sessionStorage.setItem(REMEMBERED_KEY, JSON.stringify(remembered.current)); } catch { /* storage blocked */ }
    // Warm the other area's remembered page once the browser is idle, so a swipe lands on it ready.
    const other: DashboardArea = routedArea === "you" ? "community" : "you";
    const target = dashboardAreaHref(other, sections, remembered.current[other]);
    if (!target) return;
    const idle = window.requestIdleCallback ?? ((callback: () => void) => window.setTimeout(callback, 600));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => router.prefetch(target));
    return () => cancel(handle);
    // sections only changes identity on refresh; the remembered targets are what matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, routedArea, router]);
  // Desktop sidebar can fold to an icon rail; remembered per browser. The fold
  // is a FLIP: the page takes its final margin at once (one layout) and slides
  // from where it was, while the full-width sidebar is trimmed from the right in
  // step; the rail swaps in only when the trim ends. A second click mid-fold
  // turns it around from wherever it is on screen.
  const [sidebar, setSidebar] = useState<SidebarPhase>("open");
  const asideRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const sidebarMotion = useRef<Animation[]>([]);
  useEffect(() => {
    try { if (window.localStorage.getItem(COLLAPSED_KEY) === "1") setSidebar("rail"); } catch { /* storage blocked: stay expanded */ }
    return () => sidebarMotion.current.forEach(animation => animation.cancel());
  }, []);
  const collapsed = sidebar === "folding" || sidebar === "rail";
  const toggleCollapsed = () => {
    const folding = !collapsed;
    try { window.localStorage.setItem(COLLAPSED_KEY, folding ? "1" : "0"); } catch { /* storage blocked */ }
    const aside = asideRef.current, page = pageRef.current;
    const toggle = aside?.querySelector<HTMLElement>("[data-sidebar-toggle]");
    const moving = sidebar === "folding" || sidebar === "unfolding";
    if (!aside || !page || !toggle || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sidebarMotion.current.forEach(animation => animation.cancel());
      setSidebar(folding ? "rail" : "open");
      return;
    }
    // First: where the trim and the page are on screen right now.
    const trimFrom = moving ? clipRight(getComputedStyle(aside).clipPath) : folding ? 0 : RAIL_SHIFT;
    const pageLeft = parseFloat(getComputedStyle(page).marginLeft) + shiftX(getComputedStyle(page).transform);
    sidebarMotion.current.forEach(animation => animation.cancel());
    // Last: the page's final margin, laid out once.
    flushSync(() => setSidebar(folding ? "folding" : "unfolding"));
    const pageFrom = pageLeft - parseFloat(getComputedStyle(page).marginLeft);
    // Invert and play: only clip-path and transform move.
    const trimTo = folding ? RAIL_SHIFT : 0;
    const timing = { duration: SIDEBAR_MS * Math.max(0.35, Math.abs(trimTo - trimFrom) / RAIL_SHIFT), easing: SIDEBAR_EASE, fill: "forwards" as const };
    const edge = (inset: number) => ({ transform: `translateX(${-inset}px)` });
    const trim = aside.animate([{ clipPath: `inset(0px ${trimFrom}px 0px 0px)` }, { clipPath: `inset(0px ${trimTo}px 0px 0px)` }], timing);
    sidebarMotion.current = [
      trim,
      aside.animate([edge(trimFrom), edge(trimTo)], { ...timing, pseudoElement: "::after" }),
      toggle.animate([edge(trimFrom), edge(trimTo)], timing),
      page.animate([{ transform: `translateX(${pageFrom}px)` }, { transform: "translateX(0px)" }], { ...timing, fill: "none" }),
    ];
    trim.finished.then(() => {
      flushSync(() => setSidebar(folding ? "rail" : "open"));
      sidebarMotion.current.forEach(animation => animation.cancel());
      sidebarMotion.current = [];
    }, () => { /* cancelled: a second click turned it around */ });
  };
  const rail = sidebar === "rail";
  // Keyed on the address, not the sections object: a refresh hands the shell a
  // new (equal) sections array, which re-ran this and prefetched in a loop.
  const communityPrefetchHref = dashboardAreaHref("community", sections);
  const shellItems = sections.flatMap(section => section.items);
  const learningHref = (shellItems.find(item => item.key === "sogp") ?? shellItems.find(item => item.key === "sogp-enrol"))?.href ?? "/dashboard/sogp";
  useEffect(() => {
    router.prefetch("/dashboard");
    if (communityPrefetchHref) router.prefetch(communityPrefetchHref);
  }, [router, communityPrefetchHref]);
  // Back/forward keeps the browser's own scroll position.
  const historyNavigation = useRef(false);
  const lastPathname = useRef(pathname);
  useEffect(() => {
    const onPop = () => { historyNavigation.current = true; };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  useEffect(() => {
    const href = window.location.pathname + window.location.search;
    if (restoreScroll.current === href) {
      document.scrollingElement?.scrollTo({ top: scrollPositions.current.get(href) ?? 0, behavior: "instant" });
      restoreScroll.current = null;
      lastPathname.current = pathname;
      return;
    }
    // Every other new page opens at the top (user report: some opened mid-scroll).
    if (pathname !== lastPathname.current && !navigating) {
      if (!historyNavigation.current) document.scrollingElement?.scrollTo({ top: 0, behavior: "instant" });
      historyNavigation.current = false;
      lastPathname.current = pathname;
    }
  }, [pathname, navigating]);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 64rem)");
    const onChange = () => { if (wide.matches) setMenu({ open: false, pathname: null }); };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  return <CrumbLabelProvider><div data-sidebar-collapsed={collapsed || undefined} data-sidebar-phase={sidebar} className={cn("pleros-select-scope site-font-theme min-h-dvh bg-white font-[family-name:var(--font-be-vietnam-pro)]", dashboardFont.variable, dashboardHeadingFont.variable, dashboardFont.className, v3.root, frame.root)}>
    <a href="#dashboard-main" className={cn(frame.skipLink, focusRing)}>Skip to content</a>
    <aside ref={asideRef} className={frame.liveSidebar} data-collapsed={rail || undefined} data-phase={sidebar}>
      <Brand collapsed={rail} onToggle={toggleCollapsed} />
      <div className={frame.sidebarScroll}><Profile viewer={viewer} compact={rail} /><ShellNavigation sections={sections} area={area} onArea={selectTab} collapsed={rail} /></div>
      <AccountActions compact={rail} />
    </aside>
    <div ref={pageRef} className={frame.liveFrame}>
      {/* The You/Community switch stays on every page (user request, 18 October); deep pages
          add the breadcrumb below it, which carries the way back. */}
      <RootHeader active={area} communityAvailable={dashboardAreaHref("community", sections) !== null} className={frame.liveHeader}
        onMenu={() => setMenu({ open: true, pathname })} onTab={selectRootTab}
        menuControl={<button className={cn(v3.iconButton, frame.mobileMenu)} onClick={() => setMenu({ open: true, pathname })} aria-label="Open dashboard navigation" aria-expanded={menuOpen} aria-controls={drawerId} aria-haspopup="dialog"><DashboardIcon name="menu" /></button>}
        notifications={notificationControl ?? <NotificationBell />} />
      {focusedLearning ? <Breadcrumbs pathname={pathname} title={focusedLearning} back={focus!.back} /> : null}
      <main id="dashboard-main" className={frame.routeMain} {...swipeHandlers}>
        <div ref={viewportRef} className={frame.routeViewport} data-route-origin={routedArea}>
          <motion.div className={v3.swipeTrack} style={trackStyle}>
            {(["you", "community"] as const).map(pageArea => <div key={pageArea} className={cn(v3.swipePage, frame.routePage)}
              data-area={pageArea} data-active={pageArea === area} inert={pageArea !== area} aria-hidden={pageArea !== area}>
              {pageArea === routedArea ? children : <DashboardLoading />}
              {pageArea === "you" && routedArea === "you" ? <YouBottomBar learningHref={learningHref} /> : null}
            </div>)}
          </motion.div>
        </div>
      </main>
    </div>
    <Drawer open={menuOpen} onClose={closeMenu} viewer={viewer} sections={sections} area={area} onArea={selectTab} id={drawerId} />
  </div></CrumbLabelProvider>;
}
