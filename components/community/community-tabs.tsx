"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircleIcon } from "lucide-react";

import { useUnreadMessages } from "./messages/use-unread-messages";
import type { DashboardNavItem } from "@/lib/dashboard/navigation";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";

const communityPriority = ["disciples", "enrollees", "location-group"];

export function buildCommunitySwitcherItems(navigation: DashboardNavItem[]): DashboardNavItem[] {
  const priority = communityPriority.flatMap(key => navigation.filter(item => item.key === key));
  const remaining = navigation.filter(item => !communityPriority.includes(item.key));
  return [
    ...priority,
    { key: "community-home", label: "Community home", href: "/dashboard/community", exact: true },
    ...remaining,
  ];
}

function isSwitcherItemActive(pathname: string, item: DashboardNavItem): boolean {
  return pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`));
}

export function communityTitleForPath(pathname: string, unitName: string | null): string {
  if (pathname === "/dashboard/community/feed") return "Community feed";
  if (pathname.includes("/dashboard/community/leader")) return "Leader";
  if (pathname.includes("/dashboard/community/messages")) return "Messages";
  if (pathname.includes("/dashboard/community/discipleship")) {
    return "Discipleship";
  }
  if (pathname.includes("/dashboard/community/groups")) return "Groups";
  if (pathname.includes("/dashboard/community/ask")) return "Ask Pleros";
  if (pathname.includes("/dashboard/community/report/people")) return "Saved contacts";
  if (pathname.includes("/dashboard/community/report")) return "Daily report";
  if (pathname.includes("/dashboard/community/unit/")) {
    return unitName ?? "Your group";
  }
  if (pathname.includes("/dashboard/community/post/")) return "Post";
  return "Community";
}

/**
 * The white sticky contextual header at the top of every community page.
 * The title is the section switcher, so the full Community destination list
 * remains reachable from both the home screen and deeper pages.
 */
export function CommunityTopBar({ unitName,navigation = [] }: { unitName: string | null;navigation?: DashboardNavItem[] }) {
  const pathname = usePathname() ?? "";
  const title = communityTitleForPath(pathname, unitName);
  const unreadMessages = useUnreadMessages();
  const destinations = buildCommunitySwitcherItems(navigation);

  // Sticks below the dashboard shell's phone/tablet bar and at the very top
  // from `lg`. White with one neutral bottom edge; no legacy blue bar.
  return (
    <header className="sticky top-[var(--dashboard-topbar-offset,0px)] z-30 border-b border-b-[var(--color-community-edge)] bg-white">
      <div className="site-shell-page sogp-shell-page flex h-14 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {navigation.length ? <details className="group relative"><summary className="flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-[10px] px-2 text-[18px] font-medium leading-[26px] text-[var(--color-community-ink)] transition-colors hover:bg-(--color-surface-muted)">{title}<span className="flex transition-transform group-open:rotate-180"><DashboardIcon name="down" size={16} /></span></summary><nav aria-label="Community destinations" className="absolute left-0 top-[calc(100%+4px)] z-40 grid max-h-[min(32rem,70dvh)] min-w-64 gap-0.5 overflow-y-auto rounded-[12px] border border-(--color-line) bg-white p-2 text-(--color-text-strong) shadow-[0_1px_2px_rgb(15_23_40_/_6%),0_14px_32px_rgb(15_23_40_/_10%)]">{destinations.map(item=>{const active=isSwitcherItemActive(pathname,item);return <Link key={item.key} href={item.href} prefetch={item.key === "disciples" ? false : undefined} aria-current={active ? "page" : undefined} className={`flex min-h-9 items-center rounded-[9px] px-3 text-sm transition-colors ${active ? "bg-(--status-blue-bg) font-medium text-(--status-blue-text)" : "text-(--color-text-strong) hover:bg-(--color-surface-muted)"}`} onClick={event=>{event.currentTarget.closest("details")?.removeAttribute("open");}}>{item.label}</Link>})}</nav></details> : <p className="truncate text-[18px] font-medium leading-[26px] text-[var(--color-community-ink)]">{title}</p>}
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard/community/messages"
            aria-label={
              unreadMessages > 0
                ? `Messages, ${unreadMessages} unread`
                : "Messages"
            }
            className="relative inline-flex size-11 items-center justify-center rounded-full text-[var(--color-community-ink)] hover:text-[var(--color-community-blue)]"
          >
            <MessageCircleIcon className="size-5" strokeWidth={2.1} />
            {unreadMessages > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-(--color-community-blue) px-1 text-[0.6rem] font-bold text-white">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}
