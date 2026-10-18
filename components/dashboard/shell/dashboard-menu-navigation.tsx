"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BuildingIcon, ChevronDownIcon, LayoutGridIcon, ShieldIcon, UsersRoundIcon } from "lucide-react";

import type { DashboardNavItem, DashboardNavSection } from "@/lib/dashboard/navigation";
import { dashboardAreaForPath, dashboardAreaHref } from "@/lib/dashboard/shell-navigation";
import type { DashboardArea } from "@/lib/dashboard/swipe-tabs";

import { NavBadge } from "./dashboard-nav";
import styles from "./dashboard-menu.module.css";

type Child = { key: string; label: string; href: string; exact?: boolean; badge?: DashboardNavItem["badge"] };

/** The children each area shows, picked from the viewer's authorised navigation. */
function areaChildren(sections: DashboardNavSection[]): Record<DashboardArea, Child[]> {
  const items = sections.flatMap(section => section.items);
  const find = (key: string) => items.find(item => item.key === key);
  const pick = (entries: Array<[string, string, string?]>) => entries.flatMap(([key, label, href]) => {
    const item = find(key);
    return item ? [{ key, label, href: href ?? item.href, exact: item.exact, badge: item.badge }] : [];
  });
  const learning = find("sogp") ? [{ key: "sogp", label: "Learning", href: "/dashboard/sogp" }] : find("sogp-enrol") ? [{ key: "sogp-enrol", label: "Enrol in SOGP", href: find("sogp-enrol")!.href }] : [];
  const community = Boolean(find("feed"));
  // The same places as the You and Community bottom bars. Reports sits in
  // Community; viewers without Community (church-only reporting) keep it under You.
  return {
    you: [
      { key: "overview", label: "Home", href: "/dashboard", exact: true },
      ...learning,
      { key: "library", label: "Library", href: "/dashboard/library" },
      { key: "partner", label: "Partner", href: "/dashboard/partner" },
      ...(community ? [] : pick([["report", "My reports"], ["contacts", "Saved contacts"]])),
    ],
    community: community ? [
      { key: "community-home", label: "Home", href: "/dashboard/community", exact: true },
      ...pick([["groups", "Groups"], ["feed", "Feed"], ["messages", "Inbox"], ["report", "My reports"], ["contacts", "Saved contacts"], ["enrollees", "My enrollees"]]),
    ] : [],
  };
}

function isCurrent(pathname: string, child: Child) {
  if (child.exact) return pathname === child.href;
  if (child.key === "messages") return pathname.startsWith("/dashboard/community/messages") || pathname.startsWith("/dashboard/community/ask");
  return pathname === child.href || pathname.startsWith(`${child.href}/`);
}

/** Sidebar and drawer navigation: You, Community and Leadership. */
export function DashboardMenuNavigation({ sections, area, onArea, onNavigate }: {
  sections: DashboardNavSection[]; area: DashboardArea;
  onArea: (next: DashboardArea, animated?: boolean) => void; onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? "/dashboard";
  const children = areaChildren(sections);
  const community = dashboardAreaHref("community", sections);
  const routed = dashboardAreaForPath(pathname);
  const items = sections.flatMap(section => section.items);
  const leadership = ["church", "admin", "instructor-workspace", "pastor-workspace"].flatMap(key => items.filter(item => item.key === key)).filter((item, index, list) => list.findIndex(other => other.href === item.href) === index);

  return <nav aria-label="Dashboard" className={styles.menu}>
    {(["you", "community"] as const).map(next => {
      const href = next === "you" ? "/dashboard" : community;
      const Icon = next === "you" ? LayoutGridIcon : UsersRoundIcon;
      const open = area === next;
      const label = next === "you" ? "You" : "Community";
      if (!href) return <span key={next} className={`${styles.areaLink} ${styles.unavailable}`} aria-disabled="true"><Icon className="size-4" strokeWidth={2} /><span>{label}</span></span>;
      return <div key={next} className={styles.area}>
        <Link href={href} className={styles.areaLink} data-active={open || undefined} aria-expanded={open} onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          if (area === next) { onNavigate?.(); return; }
          event.preventDefault(); onArea(next, event.detail !== 0); onNavigate?.();
        }}>
          <Icon className="size-4" strokeWidth={2} /><span>{label}</span>
          {!open && next === "community" ? <NavBadge kind="messages" /> : null}
          <ChevronDownIcon className="size-4" strokeWidth={2} style={{ transform: open ? "none" : "rotate(-90deg)", opacity: .6 }} aria-hidden="true" />
        </Link>
        {open && children[next].length ? <div className={styles.children}>
          {children[next].map(child => <Link key={child.key} href={child.href} onClick={onNavigate} className={styles.child} aria-current={routed === next && isCurrent(pathname, child) ? "page" : undefined}>
            <span>{child.label}</span>{child.badge ? <NavBadge kind={child.badge} /> : null}
          </Link>)}
        </div> : null}
      </div>;
    })}
    {leadership.length ? <>
      <p className={styles.label}>Leadership</p>
      {leadership.map(item => <Link key={item.key} href={item.href} onClick={onNavigate} className={styles.areaLink} data-active={pathname === item.href || pathname.startsWith(`${item.href}/`) || undefined}>
        {item.key === "church" ? <BuildingIcon className="size-4" strokeWidth={2} /> : <ShieldIcon className="size-4" strokeWidth={2} />}<span>{item.label}</span>
      </Link>)}
    </> : null}
  </nav>;
}
