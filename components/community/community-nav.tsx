"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListIcon, StarIcon, UsersIcon, type LucideIcon } from "lucide-react";

type NavItem = {
  key: "feed" | "unit" | "leader";
  label: string;
  href: string;
  icon: LucideIcon;
};

function buildItems(unitId: number | null, showLeaderTab: boolean): NavItem[] {
  const items: NavItem[] = [
    {
      key: "feed",
      label: "Feed",
      href: "/dashboard/community",
      icon: ListIcon,
    },
  ];
  if (unitId != null) {
    items.push({
      key: "unit",
      label: "Your unit",
      href: `/dashboard/community/unit/${unitId}`,
      icon: UsersIcon,
    });
  }
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
  onNavigate,
  className = "",
}: {
  unitId: number | null;
  showLeaderTab?: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname() ?? "";
  const items = buildItems(unitId, showLeaderTab);

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
          </Link>
        );
      })}
    </nav>
  );
}
