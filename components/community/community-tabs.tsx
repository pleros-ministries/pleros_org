"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircleIcon } from "lucide-react";

import { useUnreadMessages } from "./messages/use-unread-messages";
import type { DashboardNavItem } from "@/lib/dashboard/navigation";
import { DashboardIcon } from "@/components/dashboard/v3/primitives";

function useTitle(unitName: string | null): string {
  const pathname = usePathname() ?? "";
  if (pathname === "/dashboard/community/feed") return "Community feed";
  if (pathname.includes("/dashboard/community/leader")) return "Leader";
  if (pathname.includes("/dashboard/community/messages")) return "Messages";
  if (pathname.includes("/dashboard/community/discipleship")) {
    return "Discipleship";
  }
  if (pathname.includes("/dashboard/community/groups")) return "Groups";
  if (pathname.includes("/dashboard/community/ask")) return "Ask Pleros";
  if (pathname.includes("/dashboard/community/report")) return "Daily report";
  if (pathname.includes("/dashboard/community/unit/")) {
    return unitName ?? "Your group";
  }
  if (pathname.includes("/dashboard/community/post/")) return "Post";
  return "Community";
}

/**
 * The white sticky contextual header at the top of every inner community
 * page (approved 2026-10-16 mockup). The dashboard shell carries the
 * community's navigation; this keeps the contextual title, the destinations
 * dropdown, and the Messages shortcut with unread state.
 */
export function CommunityTopBar({ unitName,navigation = [] }: { unitName: string | null;navigation?: DashboardNavItem[] }) {
  const title = useTitle(unitName);
  const unreadMessages = useUnreadMessages();

  // Sticks below the dashboard shell's phone/tablet bar and at the very top
  // from `lg`. White with one neutral bottom edge; no legacy blue bar.
  return (
    <header className="sticky top-[var(--dashboard-topbar-offset,0px)] z-30 border-b border-b-[var(--color-community-edge)] bg-white">
      <div className="site-shell-page sogp-shell-page flex h-14 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {navigation.length ? <details className="relative"><summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-[18px] font-medium leading-[26px] text-[var(--color-community-ink)]">{title}<DashboardIcon name="down" size={16} /></summary><nav aria-label="Community destinations" className="absolute left-0 top-full z-40 grid min-w-56 rounded-[11px] border border-(--color-line) bg-white p-2 text-(--color-text-strong)"><Link href="/dashboard/community" className="flex min-h-11 items-center rounded-md px-3 text-sm text-(--color-text-strong)" onClick={event=>event.currentTarget.closest("details")?.removeAttribute("open")}>Community home</Link>{navigation.map(item=><Link key={item.key} href={item.href} prefetch={item.key === "disciples" ? false : undefined} className="flex min-h-11 items-center rounded-md px-3 text-sm text-(--color-text-strong)" onClick={event=>{event.currentTarget.closest("details")?.removeAttribute("open");}}>{item.label}</Link>)}</nav></details> : <p className="truncate text-[18px] font-medium leading-[26px] text-[var(--color-community-ink)]">{title}</p>}
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
