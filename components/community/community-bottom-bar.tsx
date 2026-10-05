"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ListIcon,
  MenuIcon,
  MessageCircleIcon,
  MessageCircleQuestionIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";

import { useUnreadQuestions } from "./ask/use-unread-questions";
import { useUnreadMessages } from "./messages/use-unread-messages";

const BASE = "/dashboard/community";

type BarItem = {
  key: "feed" | "groups" | "messages" | "ask";
  label: string;
  href: string;
  icon: LucideIcon;
  /** Path prefixes (beyond `href`) that also light this item up. */
  also?: string[];
};

const ITEMS: BarItem[] = [
  { key: "feed", label: "Feed", href: BASE, icon: ListIcon, also: [`${BASE}/post`] },
  {
    key: "groups",
    label: "Groups",
    href: `${BASE}/groups`,
    icon: UsersRoundIcon,
    // Location and discipleship groups are reached from the groups page.
    also: [`${BASE}/unit`, `${BASE}/discipleship`],
  },
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

const itemClass =
  "relative grid min-h-12 content-center justify-items-center gap-1 rounded-[0.45rem] text-[0.62rem] font-semibold transition-colors";
const idleClass =
  "text-(--color-text-muted) hover:bg-(--color-brand-sky) hover:text-(--color-brand-blue)";
const activeClass = "bg-(--color-brand-sky) text-(--color-brand-blue)";

/**
 * The community's bottom bar on phones and small tablets: the four main
 * destinations plus "More", which opens the full menu. It sticks to the bottom
 * of the screen while the community is in view and rests above the site footer
 * instead of covering it. Larger screens use the top bar and side rail.
 */
export function CommunityBottomBar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname() ?? "";
  const unreadMessages = useUnreadMessages();
  const unreadQuestions = useUnreadQuestions();

  if (IN_CONVERSATION.test(pathname)) return null;

  return (
    <nav
      aria-label="Community"
      className="sticky bottom-[calc(0.75rem_+_env(safe-area-inset-bottom))] z-30 mx-3 grid grid-cols-5 rounded-(--radius-md) border border-(--color-line) bg-white p-1.5 shadow-(--shadow-lg) lg:hidden"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.key}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`${itemClass} ${active ? activeClass : idleClass}`}
          >
            <span className="relative">
              <Icon className="size-4" strokeWidth={2} />
              {item.key === "messages" && unreadMessages > 0 ? (
                <span
                  aria-label={`${unreadMessages} unread`}
                  className="absolute -right-2.5 -top-1.5 grid min-w-4 place-items-center rounded-full bg-(--color-brand-blue) px-1 text-[0.6rem] font-bold leading-4 text-white"
                >
                  {unreadMessages > 9 ? "9+" : unreadMessages}
                </span>
              ) : null}
              {item.key === "ask" && unreadQuestions > 0 ? (
                <span
                  aria-label="Pleros has replied"
                  className="absolute -right-1 -top-0.5 size-2 rounded-full bg-(--color-brand-blue)"
                />
              ) : null}
            </span>
            {item.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMenu}
        aria-label="More community pages"
        className={`${itemClass} ${idleClass}`}
      >
        <MenuIcon className="size-4" strokeWidth={2} />
        More
      </button>
    </nav>
  );
}
