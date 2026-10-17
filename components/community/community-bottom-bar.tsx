"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HouseIcon,
  ListIcon,
  MessageCircleIcon,
  MessageCircleQuestionIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";

import { useUnreadQuestions } from "./ask/use-unread-questions";
import { useUnreadMessages } from "./messages/use-unread-messages";

const BASE = "/dashboard/community";

type BarItem = {
  key: "home" | "feed" | "groups" | "messages" | "ask";
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
  {
    key: "messages",
    label: "Messages",
    href: `${BASE}/messages`,
    icon: MessageCircleIcon,
  },
  {
    key: "ask",
    label: "Ask Pleros",
    href: `${BASE}/ask`,
    icon: MessageCircleQuestionIcon,
  },
];

function isActive(pathname: string, item: BarItem): boolean {
  if (item.href === BASE && pathname === BASE) return true;
  const prefixes = [...(item.href === BASE ? [] : [item.href]), ...(item.also ?? [])];
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
const activeClass =
  "text-[var(--color-community-blue)] before:absolute before:-top-1.5 before:left-1/4 before:right-1/4 before:h-0.5 before:rounded-full before:bg-[var(--color-community-blue)]";

/**
 * The community's bottom bar on phones and small tablets: its five main
 * destinations; the full menu stays in the top bar. It is docked flush to the
 * bottom edge of the screen while the community is in view and rests above the
 * site footer instead of covering it. Larger screens use the top bar and side
 * rail.
 */
export function CommunityBottomBar({ placement = "bottom" }: { placement?: "bottom" | "top" }) {
  const pathname = usePathname() ?? "";
  const unreadMessages = useUnreadMessages();
  const unreadQuestions = useUnreadQuestions();

  if (placement === "bottom" && IN_CONVERSATION.test(pathname)) return null;

  return (
    <nav
      aria-label="Community"
      className={placement === "top"
        ? "sticky top-12 z-20 hidden border-b border-(--color-line) bg-white lg:flex lg:justify-center lg:gap-2 lg:px-6 lg:py-1"
        : "sticky bottom-0 z-30 grid grid-cols-5 border-t border-(--color-line) bg-white px-1 pt-1.5 pb-[calc(0.25rem_+_env(safe-area-inset-bottom))] lg:hidden"}
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item);
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
              <Icon className={placement === "top" ? "size-4" : "size-5"} strokeWidth={1.8} />
              {item.key === "messages" && unreadMessages > 0 ? (
                <span
                  aria-label={`${unreadMessages} unread`}
                  className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-[var(--color-community-blue)] px-1 text-[0.6rem] font-bold leading-4 text-white"
                >
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              ) : null}
              {item.key === "ask" && unreadQuestions > 0 ? (
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
