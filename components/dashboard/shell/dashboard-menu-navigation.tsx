"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon, ChevronDownIcon, CircleUserRoundIcon, ClipboardCheckIcon, ContactRoundIcon, GraduationCapIcon,
  HeartHandshakeIcon, HouseIcon, InboxIcon, LibraryBigIcon, ListIcon, NetworkIcon, ShieldCheckIcon, SparklesIcon,
  UsersRoundIcon, type LucideIcon,
} from "lucide-react";

import type { DashboardNavItem, DashboardNavSection } from "@/lib/dashboard/navigation";
import { dashboardAreaForPath, dashboardAreaHref } from "@/lib/dashboard/shell-navigation";
import type { DashboardArea } from "@/lib/dashboard/swipe-tabs";

import { NavBadge } from "./dashboard-nav";
import styles from "./dashboard-menu.module.css";

type Child = { key: string; label: string; href: string; icon: LucideIcon; exact?: boolean; badge?: DashboardNavItem["badge"] };

/** Each destination's icon, shared with the bottom bars where they overlap. */
const ICONS: Record<string, LucideIcon> = {
  overview: HouseIcon, sogp: BookOpenIcon, "sogp-enrol": BookOpenIcon, library: LibraryBigIcon, partner: HeartHandshakeIcon,
  report: ClipboardCheckIcon, contacts: ContactRoundIcon, "community-home": HouseIcon, groups: UsersRoundIcon,
  feed: ListIcon, messages: InboxIcon, enrollees: GraduationCapIcon,
};

/** The children each area shows, picked from the viewer's authorised navigation. */
function areaChildren(sections: DashboardNavSection[]): Record<DashboardArea, Child[]> {
  const items = sections.flatMap(section => section.items);
  const find = (key: string) => items.find(item => item.key === key);
  const child = (key: string, label: string, href: string, extra: Partial<Child> = {}): Child => ({ key, label, href, icon: ICONS[key] ?? SparklesIcon, ...extra });
  const pick = (entries: Array<[string, string]>) => entries.flatMap(([key, label]) => {
    const item = find(key);
    return item ? [child(key, label, item.href, { exact: item.exact, badge: item.badge })] : [];
  });
  const learning = find("sogp") ? [child("sogp", "Learning", "/dashboard/sogp")] : find("sogp-enrol") ? [child("sogp-enrol", "Enrol in SOGP", find("sogp-enrol")!.href)] : [];
  const community = Boolean(find("feed"));
  // The same places as the You and Community bottom bars. Reports sits in
  // Community; viewers without Community (church-only reporting) keep it under You.
  return {
    you: [
      child("overview", "Home", "/dashboard", { exact: true }),
      ...learning,
      child("library", "Library", "/dashboard/library"),
      child("partner", "Partner", "/dashboard/partner"),
      ...(community ? [] : pick([["report", "My reports"], ["contacts", "Saved contacts"]])),
    ],
    community: community ? [
      child("community-home", "Home", "/dashboard/community", { exact: true }),
      ...pick([["groups", "Groups"], ["feed", "Feed"], ["messages", "Inbox"], ["report", "My reports"], ["contacts", "Saved contacts"], ["enrollees", "My enrollees"]]),
    ] : [],
  };
}

function isCurrent(pathname: string, child: Child) {
  if (child.exact) return pathname === child.href;
  if (child.key === "messages") return pathname.startsWith("/dashboard/community/messages") || pathname.startsWith("/dashboard/community/ask");
  return pathname === child.href || pathname.startsWith(`${child.href}/`);
}

/**
 * Sidebar and drawer navigation: You, Community and Leadership. The area name
 * opens that area; its chevron only expands or folds the list (user request,
 * 18 October). Collapsed (desktop rail), every destination shows as an icon.
 */
export function DashboardMenuNavigation({ sections, area, onArea, onNavigate, collapsed = false }: {
  sections: DashboardNavSection[]; area: DashboardArea;
  onArea: (next: DashboardArea, animated?: boolean) => void; onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const children = areaChildren(sections);
  const community = dashboardAreaHref("community", sections);
  const routed = dashboardAreaForPath(pathname);
  // Which list is open: follows the current area until the viewer folds or opens one.
  const [expanded, setExpanded] = useState<{ area: DashboardArea | null; for: DashboardArea } | null>(null);
  const open = expanded && expanded.for === area ? expanded.area : area;
  const items = sections.flatMap(section => section.items);
  const leadership = ["church", "admin", "instructor-workspace", "pastor-workspace"].flatMap(key => items.filter(item => item.key === key)).filter((item, index, list) => list.findIndex(other => other.href === item.href) === index);

  if (collapsed) {
    return <nav aria-label="Dashboard" className={`${styles.menu} ${styles.rail}`}>
      {(["you", "community"] as const).map(next => children[next].length ? <div key={next} className={styles.railGroup} aria-label={next === "you" ? "You" : "Community"} role="group">
        {children[next].map(item => {
          const Icon = item.icon;
          return <Link key={`${next}-${item.key}`} href={item.href} title={`${next === "you" ? "You" : "Community"} · ${item.label}`} aria-label={item.label} className={styles.railLink} aria-current={routed === next && isCurrent(pathname, item) ? "page" : undefined}>
            <Icon className="size-[18px]" strokeWidth={1.9} />{item.badge ? <span className={styles.railBadge}><NavBadge kind={item.badge} /></span> : null}
          </Link>;
        })}
      </div> : null)}
      {leadership.length ? <div className={styles.railGroup} role="group" aria-label="Leadership">
        {leadership.map(item => {
          const Icon = item.key === "church" ? NetworkIcon : ShieldCheckIcon;
          return <Link key={item.key} href={item.href} title={item.label} aria-label={item.label} className={styles.railLink} aria-current={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "page" : undefined}><Icon className="size-[18px]" strokeWidth={1.9} /></Link>;
        })}
      </div> : null}
    </nav>;
  }

  return <nav aria-label="Dashboard" className={styles.menu}>
    {(["you", "community"] as const).map(next => {
      const href = next === "you" ? "/dashboard" : community;
      const Icon = next === "you" ? CircleUserRoundIcon : UsersRoundIcon;
      const isOpen = open === next;
      const label = next === "you" ? "You" : "Community";
      const listId = `dashboard-menu-${next}`;
      if (!href) return <span key={next} className={`${styles.areaLink} ${styles.unavailable}`} aria-disabled="true"><Icon className="size-[18px]" strokeWidth={1.9} /><span>{label}</span></span>;
      return <div key={next} className={styles.area}>
        <div className={styles.areaRow} data-active={area === next || undefined}>
          <Link href={href} className={styles.areaLink} onClick={event => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
            setExpanded(null);
            if (area === next) { onNavigate?.(); return; }
            event.preventDefault(); onArea(next, event.detail !== 0); onNavigate?.();
          }}>
            <Icon className="size-[18px]" strokeWidth={1.9} /><span>{label}</span>
            {!isOpen && next === "community" ? <NavBadge kind="messages" /> : null}
          </Link>
          {children[next].length ? <button type="button" className={styles.toggle} aria-expanded={isOpen} aria-controls={listId}
            aria-label={`${isOpen ? "Fold" : "Show"} ${label} pages`} onClick={() => setExpanded({ area: isOpen ? null : next, for: area })}>
            <ChevronDownIcon className="size-4" strokeWidth={2} style={{ transform: isOpen ? "none" : "rotate(-90deg)" }} aria-hidden="true" />
          </button> : null}
        </div>
        {isOpen && children[next].length ? <div id={listId} className={styles.children}>
          {children[next].map(item => {
            const ChildIcon = item.icon;
            return <Link key={item.key} href={item.href} onClick={onNavigate} className={styles.child} aria-current={routed === next && isCurrent(pathname, item) ? "page" : undefined}>
              <ChildIcon className="size-4 shrink-0" strokeWidth={1.8} aria-hidden="true" /><span>{item.label}</span>{item.badge ? <NavBadge kind={item.badge} /> : null}
            </Link>;
          })}
        </div> : null}
      </div>;
    })}
    {leadership.length ? <>
      <p className={styles.label}>Leadership</p>
      {leadership.map(item => {
        const Icon = item.key === "church" ? NetworkIcon : ShieldCheckIcon;
        return <Link key={item.key} href={item.href} onClick={onNavigate} className={styles.areaLink} data-standalone data-active={pathname === item.href || pathname.startsWith(`${item.href}/`) || undefined}>
          <Icon className="size-[18px]" strokeWidth={1.9} /><span>{item.label}</span>
        </Link>;
      })}
    </> : null}
  </nav>;
}
