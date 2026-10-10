"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckIcon, ChevronDownIcon, GiftIcon, GraduationCapIcon, HeartHandshakeIcon, LayoutGridIcon, MenuIcon, MessageCircleIcon, RotateCcwIcon, SettingsIcon, SunriseIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { dayReport } from "@/lib/preview/pleros/daily-report";
import { TIER_LABELS, TIER_ORDER, directReports, findPerson, joinedGroup, scopeIds } from "@/lib/preview/pleros/scope";
import { dashboardNavigation } from "@/lib/preview/pleros/navigation";
import type { DemoPerson, DemoState } from "@/lib/preview/pleros/types";

import { DEMO_BASE, useDemo } from "./demo-context";
import motion from "./demo.module.css";
import { Initials, Sheet, buttonSmall, focusRing } from "./ui";

type NavItem = { key: string; label: string; path: string; params?: Record<string, string>; badge?: ReactNode };
type NavSection = { key: keyof typeof sectionIcons; label: string; items: NavItem[] };
const sectionIcons = { personal: LayoutGridIcon, devotion: SunriseIcon, training: GraduationCapIcon, community: MessageCircleIcon, oversight: HeartHandshakeIcon, welcome: GiftIcon };

export function scopeLine(state: DemoState, person: DemoPerson): string {
  if (person.tier === "disciple") {
    const group = joinedGroup(state, person.id);
    return group ? `No church assignment · in ${group.name}` : "No church assignment";
  }
  const reports = scopeIds(state, person.id).length;
  if (reports > 0) return `${person.orgUnit} · ${reports} ${reports === 1 ? "person" : "people"} in scope`;
  const supervisor = person.supervisorId ? findPerson(state, person.supervisorId) : null;
  return `${person.orgUnit}${supervisor ? ` · reports to ${supervisor.firstName}` : ""}`;
}

function TierLabel({ person }: { person: DemoPerson }) {
  return TIER_LABELS[person.tier];
}

function useNav(): NavSection[] {
  const { state, viewer, today } = useDemo();
  const leads = directReports(state, viewer.id);
  const waiting = leads.filter((person) => dayReport(state, person.id, today).overall !== "complete").length;
  return dashboardNavigation.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.key !== "people" || leads.length > 0).map((item) => ({
      ...item,
      badge: item.key === "people" && waiting > 0 ? <span className="grid size-5 place-items-center rounded-full bg-(--color-brand-sky) text-[11px] tabular-nums text-(--color-brand-blue)">{waiting}</span> : undefined,
    })),
  }));
}

function isActive(pathname: string, path: string) {
  const target = path ? `${DEMO_BASE}/${path}` : DEMO_BASE;
  return pathname === target || (path === "reports" && pathname.startsWith(`${target}/`));
}

// ─── Person switcher ──────────────────────────────────────────────────────


function PersonSwitcher() {
  const { state, viewer, switchPerson, reset } = useDemo();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>("[aria-current='true']") ?? panel?.querySelector<HTMLElement>("button"))?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    function onPointer(event: PointerEvent) {
      if (
        !panelRef.current?.contains(event.target as Node) &&
        !trigger.current?.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  const people = TIER_ORDER.flatMap((tier) => state.people.filter((person) => person.tier === tier));
  const choose = (personId: string, path?: string, params?: Record<string, string>) => {
    setOpen(false);
    const target = path === undefined ? undefined : path ? `${DEMO_BASE}/${path}` : DEMO_BASE;
    switchPerson(personId, target, params);
    trigger.current?.focus();
  };

  return (
    <div className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="demo-person-panel"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-full bg-white/12 pl-1 pr-2.5 text-[13px] font-medium text-white ring-1 ring-inset ring-white/25 transition-colors hover:bg-white/20",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand-lime)",
        )}
      >
        <Initials name={viewer.name} imageSrc={viewer.photoDataUrl} size="sm" />
        <span className="lg:hidden">Switch</span>
        <span className="hidden lg:inline">Switch person</span>
        <ChevronDownIcon className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
      </button>

      {open ? (
        <div
          ref={panelRef}
          id="demo-person-panel"
          role="dialog"
          aria-label="Demo person and path"
          className={cn(
            motion.menu,
            "absolute right-0 top-[calc(100%+0.5rem)] z-50 grid max-h-[calc(100dvh-7rem)] w-[min(400px,calc(100vw-1.5rem))] overflow-y-auto rounded-[var(--radius-lg)] border border-(--color-line) bg-white text-(--color-text) shadow-[var(--shadow-lg)]",
          )}
        >
          <div className="border-b border-(--color-line) px-4 py-3">
            <p className="text-[14px] font-medium text-(--color-text-strong)">Person</p>
            
          </div>
          <ul className="grid p-1.5">
            {people.map((person) => {
              const current = person.id === viewer.id;
              const depth = TIER_ORDER.indexOf(person.tier);
              return (
                <li key={person.id}>
                  <button
                    type="button"
                    aria-current={current ? "true" : undefined}
                    onClick={() => choose(person.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors",
                      focusRing,
                      current ? "bg-(--color-brand-sky-soft)" : "hover:bg-(--color-surface-muted)",
                    )}
                  >
                    <span
                      aria-hidden
                      className="h-6 border-l border-(--color-line-strong)"
                      style={{ marginLeft: `${Math.min(depth, 3) * 10}px` }}
                    />
                    <Initials name={person.name} imageSrc={person.photoDataUrl} size="sm" tone={current ? "blue" : "sky"} />
                    <span className="grid min-w-0 flex-1">
                      <span className="truncate text-[13.5px] font-medium text-(--color-text-strong)">
                        {person.name}
                      </span>
                      <span className="truncate text-[12px] text-(--color-text-muted)">
                        <TierLabel person={person} />
                        {person.orgUnit ? ` · ${person.orgUnit}` : ""}
                      </span>
                    </span>
                    {current ? <CheckIcon className="size-4 text-(--color-brand-blue)" aria-hidden /> : null}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-3 border-t border-(--color-line) bg-(--color-surface-muted) px-4 py-3">
            
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                reset();
              }}
              className={cn(
                "inline-flex min-h-8 items-center gap-1.5 rounded-full border border-(--color-line-strong) bg-white px-3 text-[12.5px] font-medium text-(--color-text-strong) hover:border-(--color-brand-blue)",
                focusRing,
              )}
            >
              <RotateCcwIcon className="size-3.5" aria-hidden />
              Reset demo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── Frame ────────────────────────────────────────────────────────────────

/**
 * The demo strip. Below `lg` it grows to two lines so the active person's full
 * name and organisational role are readable; from `lg` it is a
 * single 48px line, which the fixed sidebar's top offset relies on.
 */
function DemoBadge() {
  return <span className="inline-flex shrink-0 items-center rounded-md bg-(--color-brand-lime) px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-[0.08em] text-(--color-brand-blue)">DEMO</span>;
}

function DemoBar({ onMenu, menuOpen }: { onMenu: () => void; menuOpen: boolean }) {
  const { viewer } = useDemo();
  const role = TIER_LABELS[viewer.tier];
  return (
    <div className="sticky top-0 z-40 bg-(--color-brand-blue) text-white">
      <div className="flex min-h-12 items-center gap-3 px-3 py-2 sm:px-5 lg:h-12 lg:py-0">
        <button type="button" onClick={onMenu} aria-label="Open dashboard navigation" aria-expanded={menuOpen} className="grid size-8 shrink-0 place-items-center rounded-md hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:hidden"><MenuIcon className="size-4" aria-hidden /></button>
        <div className="grid min-w-0 flex-1 gap-0.5 lg:hidden">
          <p className="flex min-w-0 items-center gap-2 text-[14px] font-medium leading-snug">
            <span className="sr-only">Viewing as </span>
            <span className="truncate">{viewer.name}</span>
            <DemoBadge />
          </p>
          <p className="text-[12px] leading-snug text-white/75">{role}</p>
        </div>
        
        <p className="ml-auto hidden min-w-0 truncate text-right text-[12.5px] leading-tight lg:block">
          <span className="text-white/70">Viewing as </span>
          <span className="font-medium">{viewer.name}</span>
          <span className="ml-2 inline-flex align-middle"><DemoBadge /></span>
          <span className="text-white/70"> · {role}</span>
        </p>
        <div className="shrink-0 self-start max-lg:mt-px lg:self-center">
          <PersonSwitcher />
        </div>
      </div>
      
    </div>
  );
}

function SidebarProfile({ header = false, onNavigate }: { header?: boolean; onNavigate?: () => void }) {
  const { viewer, href } = useDemo();
  return (
    <div className={cn("flex items-start gap-3", !header && "rounded-xl border border-(--color-line) px-3 py-2.5")}>
      <Initials name={viewer.name} imageSrc={viewer.photoDataUrl} />
      <div className="grid min-w-0 gap-0.5">
        <p className={cn(header ? "break-words" : "truncate", "text-[13.5px] font-medium text-(--color-text-strong)")}>{viewer.name}</p>
        <p className={cn(header ? "break-words" : "truncate", "text-[12px] text-(--color-text-muted)")}><TierLabel person={viewer} /></p>
        <Link href={href("profile")} onClick={onNavigate} className={cn(buttonSmall, "mt-1 w-fit min-h-7 gap-1.5 rounded-[calc(var(--radius-sm)/2)] px-2 text-[11.5px] text-(--color-text-muted)")}><SettingsIcon className="size-3.5" strokeWidth={1.75} aria-hidden />Profile settings</Link>
      </div>
    </div>
  );
}

function Sidebar({ drawer = false, onNavigate }: { drawer?: boolean; onNavigate?: () => void }) {
  const { href } = useDemo();
  const pathname = usePathname();
  const nav = useNav();
  const panelId = useId();
  const [expanded, setExpanded] = useState<{ pathname: string; key: string | null } | null>(null);
  const currentSection = nav.find((section) => section.items.some((item) => isActive(pathname, item.path)))?.key ?? "personal";
  const openSection = expanded?.pathname === pathname ? expanded.key : currentSection;

  const link = (item: NavItem) => {
    const active = isActive(pathname, item.path);
    return (
      <li key={item.key}>
        <Link
          href={href(item.path, item.params)}
          onClick={onNavigate}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex min-h-10 items-center gap-2 rounded-[calc(var(--radius-sm)/2)] pl-10 pr-3 text-[13px] transition-colors",
            focusRing,
            active
              ? "bg-(--color-brand-sky-soft) font-medium text-(--color-brand-blue)"
              : "text-(--color-text) hover:bg-(--color-surface-muted)",
          )}
        >
          <span className="flex-1">{item.label}</span>
          {item.badge}
        </Link>
      </li>
    );
  };

  return (
    <aside className={drawer ? "flex flex-col bg-white" : "fixed bottom-0 left-0 top-12 z-30 hidden w-64 flex-col border-r border-(--color-line) bg-white lg:flex"}>
      <div className={drawer ? "hidden" : "px-5 pb-4 pt-5"}>
        <span className="inline-flex h-9 items-center rounded-lg bg-(--color-brand-blue) px-2.5">
          <Image src="/brand/white-logotype.webp" alt="Pleros" width={345} height={177} className="h-6 w-auto" />
        </span>
      </div>
      {!drawer ? <div className="mx-3 mb-4"><SidebarProfile /></div> : null}
      <nav aria-label="Demo dashboard" className={cn("grid content-start gap-2 overflow-y-auto pb-5", drawer ? "px-0" : "px-3")}>
        {nav.map((section) => {
          const open = openSection === section.key;
          const Icon = sectionIcons[section.key];
          const id = `${panelId}-${section.key}`;
          return (
            <div key={section.key}>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setExpanded({ pathname, key: open ? null : section.key })}
                className={cn("flex min-h-11 w-full items-center gap-3 rounded-[calc(var(--radius-sm)/2)] px-3 text-left text-[14px] font-medium text-(--color-text-strong) transition-colors hover:bg-(--color-surface-muted)", open && "bg-(--color-surface-muted)", focusRing)}
              >
                <Icon className="size-[18px] shrink-0 text-(--color-brand-blue)" strokeWidth={1.75} aria-hidden />
                <span className="flex-1">{section.label}</span>
                <ChevronDownIcon className={cn(motion.navChevron, "size-3.5 text-(--color-text-muted)", open && "rotate-180")} aria-hidden />
              </button>
              <div id={id} className={motion.navPanel} data-open={open} aria-hidden={!open} inert={!open}>
                <div className="min-h-0 overflow-hidden">
                  <ul className="grid gap-0.5 pt-1">{section.items.map(link)}</ul>
                </div>
              </div>
            </div>
          );
        })}
      </nav>
      
    </aside>
  );
}

function Toast() {
  const { toast } = useDemo();
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-50 flex justify-center lg:bottom-6 lg:left-auto lg:right-6 lg:justify-end"
    >
      {toast ? (
        <p
          key={toast.id}
          className={cn(
            motion.toast,
            "max-w-md rounded-2xl px-4 py-2.5 text-[13.5px] leading-snug shadow-[var(--shadow-md)]",
            toast.tone === "error"
              ? "border border-red-200 bg-white text-red-800"
              : "bg-(--color-text-strong) text-white",
          )}
        >
          {toast.message}
        </p>
      ) : null}
    </div>
  );
}

export function DemoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const consolidatedHome = pathname === `${DEMO_BASE}/consolidated-home`;
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div
      className={cn("min-h-dvh text-(--color-text)", consolidatedHome ? "bg-white" : "bg-(--color-surface-muted)")}
    >
      <a
        href="#demo-main"
        className="sr-only z-50 rounded-full bg-white px-4 py-2 text-sm focus:not-sr-only focus:fixed focus:left-3 focus:top-14"
      >
        Skip to content
      </a>
      <DemoBar onMenu={() => setMenuOpen(true)} menuOpen={menuOpen} />
      <Sidebar />
      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title="Dashboard navigation" header={<SidebarProfile header onNavigate={() => setMenuOpen(false)} />} side="left">
        <Sidebar drawer onNavigate={() => setMenuOpen(false)} />
      </Sheet>
      <div className="lg:pl-64">
        <main
          id="demo-main"
          key={pathname}
          className={cn(motion.enter, consolidatedHome ? "w-full" : "mx-auto w-full max-w-[1120px] px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16")}
        >
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
}
