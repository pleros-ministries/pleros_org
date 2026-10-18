"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  CircleUserRoundIcon,
  HeartHandshakeIcon,
  HouseIcon,
  LibraryBigIcon,
  type LucideIcon,
} from "lucide-react";

type YouItem = {
  key: "home" | "learning" | "library" | "partner" | "profile";
  label: string;
  href: string;
  icon: LucideIcon;
  /** Path prefixes (beyond `href`) that also light this item up. */
  also?: string[];
};

/**
 * Pages with their own bottom controls (lesson and listening screens, audio
 * players) keep the bottom of the screen to themselves.
 */
const OWN_BOTTOM = /^\/dashboard\/(sogp\/course\/day\/|sogp\/listen|library\/teachings|welcomepack\/audiobook)/;

function isActive(pathname: string, item: YouItem) {
  if (item.href === "/dashboard") return pathname === "/dashboard";
  return [item.href, ...(item.also ?? [])].some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

/**
 * The You area's tabs (Pastor review, 18 October): Home, Learning, Library,
 * Partner and Profile. Grounded like Community's bar, on phones and tablets
 * only; the desktop sidebar lists the same places.
 */
export function YouBottomBar({ learningHref }: { learningHref: string }) {
  const pathname = usePathname() ?? "/dashboard";
  if (OWN_BOTTOM.test(pathname)) return null;
  const items: YouItem[] = [
    { key: "home", label: "Home", href: "/dashboard", icon: HouseIcon },
    // Welcome Pack starts the learning path; Prayer Watch is a daily habit inside Learning.
    { key: "learning", label: "Learning", href: learningHref, icon: BookOpenIcon, also: ["/dashboard/sogp", "/dashboard/pre-sogp", "/dashboard/prayer-watch", "/dashboard/welcomepack", "/dashboard/discipleship-journey"] },
    { key: "library", label: "Library", href: "/dashboard/library", icon: LibraryBigIcon, also: ["/dashboard/podcast"] },
    { key: "partner", label: "Partner", href: "/dashboard/partner", icon: HeartHandshakeIcon },
    { key: "profile", label: "Profile", href: "/dashboard/profile", icon: CircleUserRoundIcon },
  ];
  return <nav aria-label="You" className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-(--color-line) bg-white px-1 pt-1.5 pb-[calc(0.25rem_+_env(safe-area-inset-bottom))] lg:hidden">
    {items.map(item => {
      const Icon = item.icon;
      const active = isActive(pathname, item);
      return <Link key={item.key} href={item.href} aria-current={active ? "page" : undefined}
        className={`relative grid min-h-10 content-center justify-items-center gap-0.5 text-[11px] leading-[14px] font-medium transition-colors ${active
          ? "text-[var(--color-community-blue)] before:absolute before:-top-1.5 before:left-1/4 before:right-1/4 before:h-0.5 before:rounded-full before:bg-[var(--color-community-blue)]"
          : "text-(--color-text-muted) hover:text-[var(--color-community-blue)]"}`}>
        <Icon className="size-5" strokeWidth={1.8} />
        {item.label}
      </Link>;
    })}
  </nav>;
}
