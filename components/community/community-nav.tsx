"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardListIcon,
  HeartHandshakeIcon,
  ListIcon,
  MessageCircleIcon,
  MessageCircleQuestionIcon,
  StarIcon,
  UsersIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react";

import { useUnreadQuestions } from "./ask/use-unread-questions";
import { useUnreadMessages } from "./messages/use-unread-messages";

type NavItem = {
  key:
    | "feed"
    | "messages"
    | "unit"
    | "groups"
    | "discipleship"
    | "report"
    | "ask"
    | "leader";
  label: string;
  href: string;
  icon: LucideIcon;
};

function buildItems(
  unitId: number | null,
  showLeaderTab: boolean,
  showDiscipleship: boolean,
): NavItem[] {
  const items: NavItem[] = [
    {
      key: "feed",
      label: "Feed",
      href: "/dashboard/community",
      icon: ListIcon,
    },
    {
      key: "messages",
      label: "Messages",
      href: "/dashboard/community/messages",
      icon: MessageCircleIcon,
    },
  ];
  if (unitId != null) {
    items.push({
      key: "unit",
      label: "Your group",
      href: `/dashboard/community/unit/${unitId}`,
      icon: UsersIcon,
    });
  }
  items.push({
    key: "groups",
    label: "Groups",
    href: "/dashboard/community/groups",
    icon: UsersRoundIcon,
  });
  if (showDiscipleship) {
    items.push({
      key: "discipleship",
      label: "Discipleship",
      href: "/dashboard/community/discipleship",
      icon: HeartHandshakeIcon,
    });
  }
  items.push({
    key: "report",
    label: "Daily report",
    href: "/dashboard/community/report",
    icon: ClipboardListIcon,
  });
  items.push({
    key: "ask",
    label: "Ask Pleros",
    href: "/dashboard/community/ask",
    icon: MessageCircleQuestionIcon,
  });
  if (showLeaderTab) {
    items.push({
      key: "leader",
      label: "Leader",
      href: "/dashboard/community/leader",
      icon: StarIcon,
    });
  }
  return items;
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard/community") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CommunityNav({
  unitId,
  showLeaderTab = false,
  showDiscipleship = false,
  onNavigate,
  className = "",
}: {
  unitId: number | null;
  showLeaderTab?: boolean;
  showDiscipleship?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname() ?? "";
  const items = buildItems(unitId, showLeaderTab, showDiscipleship);
  const unreadMessages = useUnreadMessages();
  const unreadQuestions = useUnreadQuestions();

  return (
    <nav
      aria-label="Community navigation"
      className={`grid gap-0.5 rounded-2xl border border-(--color-line-strong) bg-white p-2 shadow-(--shadow-sm) ${className}`}
    >
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-(--muted) font-semibold text-(--color-brand-blue)"
                : "text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <Icon
              className={`size-4 shrink-0 ${
                active ? "text-(--color-brand-blue)" : "text-zinc-400"
              }`}
              strokeWidth={2}
            />
            {item.label}
            {item.key === "messages" && unreadMessages > 0 ? (
              <span
                aria-label={`${unreadMessages} unread`}
                className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-(--color-brand-blue) px-1.5 text-[0.7rem] font-semibold text-white"
              >
                {unreadMessages > 99 ? "99+" : unreadMessages}
              </span>
            ) : null}
            {item.key === "ask" && unreadQuestions > 0 ? (
              <span
                aria-label="Pleros has replied"
                className="ml-auto size-2 rounded-full bg-(--color-brand-blue)"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
