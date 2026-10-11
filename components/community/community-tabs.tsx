"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircleIcon } from "lucide-react";

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
 * The brand-blue sticky sub-header at the top of every community page. The
 * dashboard shell carries the community's navigation; this keeps the title,
 * the Messages shortcut and notifications.
 */
export function CommunityTopBar({ unitName }: { unitName: string | null }) {
  const title = useTitle(unitName);
  const unreadMessages = useUnreadMessages();

  // Sticks below the dashboard shell's phone/tablet bar (a hairline keeps the
  // two blue bars apart) and at the very top from `lg`.
  return (
    <header className="sticky top-[var(--dashboard-topbar-offset,0px)] z-30 border-y border-y-[var(--color-brand-blue)] border-t-white/15 bg-[var(--color-brand-blue)] lg:border-t-[var(--color-brand-blue)]">
      <div className="site-shell-page sogp-shell-page flex h-12 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <p className="ppc-heading truncate text-[15px] font-semibold text-white">
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
            className="relative inline-flex size-8 items-center justify-center rounded-full text-white/85 hover:text-white"
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
