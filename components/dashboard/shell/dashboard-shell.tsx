"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { motion } from "motion/react";
import { LoaderCircleIcon, LogOutIcon } from "lucide-react";

import { signOutDashboardAction } from "@/app/_actions/auth-actions";
import DashboardLoading from "@/app/(site)/dashboard/loading";
import { NotificationBell } from "@/components/community/notification-bell";
import { DashboardIcon, RootHeader } from "@/components/dashboard/v3/primitives";
import { dashboardFont } from "@/components/dashboard/v3/font";
import { useTabSwipe } from "@/components/dashboard/v3/use-tab-swipe";
import v3 from "@/components/dashboard/v3/dashboard.module.css";
import type { DashboardNavSection } from "@/lib/dashboard/navigation";
import { dashboardAreaForPath, dashboardAreaHref } from "@/lib/dashboard/shell-navigation";
import type { DashboardArea } from "@/lib/dashboard/swipe-tabs";
import { cn } from "@/lib/utils";

import { DashboardMenuNavigation } from "./dashboard-menu-navigation";
import frame from "./dashboard-shell.module.css";
import { compactButton, focusRing } from "./styles";

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

function Profile({ viewer, onNavigate }: { viewer: DashboardShellViewer; onNavigate?: () => void }) {
  const initials = viewer.name.trim().split(/\s+/).map(part => part[0] ?? "").join("").slice(0, 2).toUpperCase();
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

function SignOutSubmit() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} aria-busy={pending} className={cn(compactButton, "flex-1")}>
    {pending ? <LoaderCircleIcon className="size-3.5 animate-spin" aria-hidden /> : <LogOutIcon className="size-3.5" aria-hidden />}
    {pending ? "Signing out" : "Sign out"}
  </button>;
}

function AccountActions() {
  return <div className={frame.accountActions}>
    <form action={signOutDashboardAction} className="flex flex-1"><SignOutSubmit /></form>
  </div>;
}

function ShellNavigation({ sections, area, onArea, onNavigate }: {
  sections: DashboardNavSection[]; area: DashboardArea;
  onArea: (next: DashboardArea, animated?: boolean) => void; onNavigate?: () => void;
}) {
  return <DashboardMenuNavigation sections={sections} area={area} onArea={onArea} onNavigate={onNavigate} />;
}

function Drawer({ open, onClose, viewer, sections, area, onArea, id }: {
  open: boolean; onClose: () => void; viewer: DashboardShellViewer; sections: DashboardNavSection[];
  area: DashboardArea; onArea: (next: DashboardArea, animated?: boolean) => void; id: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (open && !dialog?.open) dialog?.showModal();
    if (!open && dialog?.open) dialog.close();
  }, [open]);
  return <dialog id={id} ref={ref} aria-labelledby={titleId} onClose={onClose}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    className={cn(v3.dialog, v3.drawer, frame.liveDrawer)}>
    <div className={v3.dialogHeading}><h2 id={titleId} data-dashboard-shell-title>Menu</h2><button className={v3.iconButton} onClick={onClose} aria-label="Close navigation"><DashboardIcon name="close" /></button></div>
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
  const focusedLearning = ({ "/dashboard/sogp":"My SOGP", "/dashboard/sogp/path":"Start SOGP", "/dashboard/sogp/plan":"Edit full plan", "/dashboard/sogp/listen":"Today’s listening" } as Record<string,string>)[pathname];
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
  useEffect(() => {
    const href = window.location.pathname + window.location.search;
    if (restoreScroll.current === href) {
      document.scrollingElement?.scrollTo({ top: scrollPositions.current.get(href) ?? 0, behavior: "instant" });
      restoreScroll.current = null;
    }
  }, [pathname, navigating]);
  useEffect(() => {
    const wide = window.matchMedia("(min-width: 64rem)");
    const onChange = () => { if (wide.matches) setMenu({ open: false, pathname: null }); };
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, []);

  return <div className={cn("pleros-select-scope site-font-theme min-h-dvh bg-white font-[family-name:var(--font-be-vietnam-pro)]", dashboardFont.variable, dashboardFont.className, v3.root, frame.root)}>
    <a href="#dashboard-main" className={cn(frame.skipLink, focusRing)}>Skip to content</a>
    <aside className={frame.liveSidebar}>
      <div className={frame.sidebarScroll}><Profile viewer={viewer} /><ShellNavigation sections={sections} area={area} onArea={selectTab} /></div>
      <AccountActions />
    </aside>
    <div className={frame.liveFrame}>
      {focusedLearning ? <header className={cn(v3.header,frame.liveHeader)}>
        <Link href={pathname === "/dashboard/sogp" ? "/dashboard" : "/dashboard/sogp"} onClick={event => { if (!window.dispatchEvent(new Event("pleros:learning-navigation",{cancelable:true}))) event.preventDefault(); }} className={v3.iconButton} aria-label={pathname === "/dashboard/sogp" ? "Back to You" : "Back to My SOGP"}><DashboardIcon name="left" /></Link>
        <span className={frame.featureTitle}>{focusedLearning}</span>
        <button type="button" className={v3.iconButton} aria-label="More options" aria-haspopup="dialog" aria-controls={drawerId} onClick={() => setMenu({ open:true,pathname })}><DashboardIcon name="more" /></button>
      </header> : <RootHeader active={area} communityAvailable={dashboardAreaHref("community", sections) !== null} className={frame.liveHeader}
        onMenu={() => setMenu({ open: true, pathname })} onTab={selectRootTab}
        menuControl={<button className={cn(v3.iconButton, frame.mobileMenu)} onClick={() => setMenu({ open: true, pathname })} aria-label="Open dashboard navigation" aria-expanded={menuOpen} aria-controls={drawerId} aria-haspopup="dialog"><DashboardIcon name="menu" /></button>}
        notifications={notificationControl ?? <NotificationBell tone="light" appearance="dashboard" />} />}
      <main id="dashboard-main" className={frame.routeMain} {...swipeHandlers}>
        <div ref={viewportRef} className={frame.routeViewport} data-route-origin={routedArea}>
          <motion.div className={v3.swipeTrack} style={trackStyle}>
            {(["you", "community"] as const).map(pageArea => <div key={pageArea} className={cn(v3.swipePage, frame.routePage)}
              data-area={pageArea} data-active={pageArea === area} inert={pageArea !== area} aria-hidden={pageArea !== area}>
              {pageArea === routedArea ? children : <DashboardLoading />}
            </div>)}
          </motion.div>
        </div>
      </main>
    </div>
    <Drawer open={menuOpen} onClose={closeMenu} viewer={viewer} sections={sections} area={area} onArea={selectTab} id={drawerId} />
  </div>;
}
