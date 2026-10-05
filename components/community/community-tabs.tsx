"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, MessageCircleIcon } from "lucide-react";

import { useUnreadMessages } from "./messages/use-unread-messages";
import { NotificationBell } from "./notification-bell";

function useTitle(unitName: string | null): string {
  const pathname = usePathname() ?? "";
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
 * The brand-blue sticky sub-header at the top of every community page. On
 * phones the bottom bar carries the menu and Messages, so they are hidden here.
 */
export function CommunityTopBar({
  unitName,
  onOpenMenu,
}: {
  unitName: string | null;
  onOpenMenu: () => void;
}) {
  const title = useTitle(unitName);
  const unreadMessages = useUnreadMessages();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]">
      <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open community menu"
            className="-ml-1.5 hidden size-9 items-center justify-center rounded-lg text-white/85 transition-colors hover:bg-white/10 hover:text-white lg:inline-flex xl:hidden"
          >
            <MenuIcon className="size-5" strokeWidth={2} />
          </button>
          <p className="ppc-heading truncate text-base font-semibold text-white">
            {title}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/dashboard/community/messages"
            aria-label={
              unreadMessages > 0
                ? `Messages, ${unreadMessages} unread`
                : "Messages"
            }
            className="relative hidden size-8 items-center justify-center rounded-full text-white/85 hover:text-white lg:inline-flex"
          >
            <MessageCircleIcon className="size-4" strokeWidth={2} />
            {unreadMessages > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-4 place-items-center rounded-full bg-(--color-brand-lime) px-1 text-[0.6rem] font-bold text-(--color-brand-blue)">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            ) : null}
          </Link>
          <NotificationBell tone="dark" />
        </div>
      </div>
    </header>
  );
}
