"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HouseIcon,
  InboxIcon,
  ListIcon,
  NetworkIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";

import { useUnreadQuestions } from "./ask/use-unread-questions";
import { useUnreadMessages } from "./messages/use-unread-messages";

const BASE = "/dashboard/community";

type BarItem = {
  key: "home" | "groups" | "feed" | "inbox" | "oversight";
  label: string;
  href: string;
  icon: LucideIcon;
  /** Path prefixes (beyond `href`) that also light this item up. */
  also?: string[];
};

const ITEMS: BarItem[] = [
  { key: "home", label: "Home", href: BASE, icon: HouseIcon },
  {
    key: "groups",
    label: "Groups",
    href: `${BASE}/groups`,
    icon: UsersRoundIcon,
    // Location and discipleship groups are reached from the groups page.
    also: [`${BASE}/unit`, `${BASE}/discipleship`],
  },
  { key: "feed", label: "Feed", href: `${BASE}/feed`, icon: ListIcon, also: [`${BASE}/post`] },
  // One Inbox for both private conversations: Messages and Ask Pleros keep
  // their own routes, data and anonymity rules; only the navigation is shared.
  { key: "inbox", label: "Inbox", href: `${BASE}/messages`, icon: InboxIcon, also: [`${BASE}/ask`] },
];

function isActive(pathname: string, item: BarItem): boolean {
  if (item.href === BASE) return pathname === BASE;
  const prefixes = [item.href, ...(item.also ?? [])];
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** An open conversation needs the bottom of the screen for its message box. */
const IN_CONVERSATION = /^\/dashboard\/community\/messages\/\d+/;

// Grounded, not floating (Pastor review, 17 October): flush to the bottom edge,
// a hairline above, the active item marked by colour and a short top rule.
const itemClass =
  "relative grid min-h-10 content-center justify-items-center gap-0.5 text-[11px] leading-[14px] font-medium transition-colors";
const idleClass = "text-(--color-text-muted) hover:text-[var(--color-community-blue)]";
const topItemClass =
  "relative inline-flex min-h-9 items-center gap-2 rounded-[10px] px-3 text-[13px] leading-5 font-medium transition-colors";
const topActiveClass = "bg-(--status-blue-bg,#e4ebfd) text-[var(--color-community-blue)]";
// Instagram-style: the active destination's icon fills in ink, no colour rule.
const activeClass = "text-[var(--color-community-ink)] font-semibold";

/**
 * Community's main destinations: Home, Groups, Feed and Inbox, plus Oversight
 * for people with church responsibilities (`oversightHref`). A grounded bottom
 * bar on phones and tablets; a slim top strip from `lg`.
 */
export function CommunityBottomBar({
  placement = "bottom",
  oversightHref = null,
}: {
  placement?: "bottom" | "top";
  oversightHref?: string | null;
}) {
  const pathname = usePathname() ?? "";
  const unreadMessages = useUnreadMessages();
  const unreadQuestions = useUnreadQuestions();

  if (placement === "bottom" && IN_CONVERSATION.test(pathname)) return null;

  const items: BarItem[] = oversightHref
    ? [...ITEMS, { key: "oversight", label: "Oversight", href: oversightHref, icon: NetworkIcon }]
    : ITEMS;

  return (
    <nav
      aria-label="Community"
      className={placement === "top"
        ? "sticky top-12 z-20 hidden border-b border-(--color-line) bg-white lg:flex lg:justify-center lg:gap-2 lg:px-6 lg:py-1"
        : `sticky bottom-0 z-30 grid ${items.length === 5 ? "grid-cols-5" : "grid-cols-4"} border-t border-(--color-line) bg-[var(--color-community-canvas)] px-1 pt-1.5 pb-[calc(0.25rem_+_env(safe-area-inset-bottom))] lg:hidden`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item);
        const inboxCount = item.key === "inbox" ? unreadMessages : 0;
        const inboxDot = item.key === "inbox" && unreadMessages === 0 && unreadQuestions > 0;
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={placement === "top"
              ? `${topItemClass} ${active ? topActiveClass : idleClass}`
              : `${itemClass} ${active ? activeClass : idleClass}`}
          >
            <span className="relative">
              <Icon
                className={placement === "top" ? "size-4" : "size-5"}
                strokeWidth={active && placement === "bottom" ? (item.key === "feed" ? 2.6 : 2) : 1.8}
                fill={active && placement === "bottom" && item.key !== "feed" ? "currentColor" : "none"}
              />
              {inboxCount > 0 ? (
                <span
                  aria-label={`${inboxCount} unread`}
                  className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-[var(--color-community-blue)] px-1 text-[0.6rem] font-bold leading-4 text-white"
                >
                  {inboxCount > 9 ? "9+" : inboxCount}
                </span>
              ) : null}
              {inboxDot ? (
                <span
                  aria-label="Pleros has replied"
                  className="absolute -right-1 -top-0.5 size-2 rounded-full bg-[var(--color-community-blue)]"
                />
              ) : null}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** The Messages · Ask Pleros switch at the top of the two Inbox list pages. */
export function InboxSwitch() {
  const pathname = usePathname() ?? "";
  const unreadMessages = useUnreadMessages();
  const unreadQuestions = useUnreadQuestions();
  const onMessages = pathname === `${BASE}/messages`;
  const onAsk = pathname === `${BASE}/ask`;
  if (!onMessages && !onAsk) return null;

  const tab = "inline-flex h-8 items-center justify-center gap-1.5 rounded-[7px] text-[13px] font-medium transition-colors";
  return (
    <nav aria-label="Inbox" className="site-shell-page sogp-shell-page pt-4 pb-2">
      <div className="mx-auto grid w-full max-w-[48rem] grid-cols-2 rounded-[10px] bg-[#eceef2] p-[3px]">
        <Link href={`${BASE}/messages`} aria-current={onMessages ? "page" : undefined} className={`${tab} ${onMessages ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}>
          Messages
          {unreadMessages > 0 ? <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[var(--color-community-blue)] px-1 text-[11px] font-semibold text-white">{unreadMessages > 9 ? "9+" : unreadMessages}</span> : null}
        </Link>
        <Link href={`${BASE}/ask`} aria-current={onAsk ? "page" : undefined} className={`${tab} ${onAsk ? "bg-white text-[var(--color-community-ink)] shadow-[0_1px_2px_rgb(0_0_0/8%)]" : "text-[var(--color-community-muted)]"}`}>
          Ask Pleros
          {unreadQuestions > 0 ? <span aria-label="Pleros has replied" className="size-2 rounded-full bg-[var(--color-community-blue)]" /> : null}
        </Link>
      </div>
    </nav>
  );
}
