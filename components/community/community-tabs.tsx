import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { NotificationBell } from "./notification-bell";

type Tab = "feed" | "unit" | "leader";

export function CommunityTabs({
  current,
  unitId,
  title,
  showLeaderTab = false,
}: {
  current: Tab;
  unitId: number | null;
  title: string;
  showLeaderTab?: boolean;
}) {
  const tabs: Array<{ key: Tab; label: string; href: string }> = [
    { key: "feed", label: "Feed", href: "/dashboard/community" },
  ];
  if (unitId != null) {
    tabs.push({
      key: "unit",
      label: "Your unit",
      href: `/dashboard/community/unit/${unitId}`,
    });
  }
  if (showLeaderTab) {
    tabs.push({
      key: "leader",
      label: "Leader",
      href: "/dashboard/community/leader",
    });
  }

  return (
    <>
      <nav
        aria-label="Community navigation"
        className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)] shadow-sm"
      >
        <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-sm px-1 text-xs font-medium text-white/85 transition-colors duration-150 hover:text-white"
          >
            <ArrowLeftIcon className="size-3.5" strokeWidth={2} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-[var(--color-brand-lime)]">
              Community
            </span>
            <NotificationBell />
          </div>
        </div>
      </nav>

      <div className="site-shell-page sogp-shell-page flex flex-wrap items-center gap-1 pt-4">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={tab.key === current ? "page" : undefined}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              tab.key === current
                ? "bg-[var(--color-brand-blue)] text-white"
                : "text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="site-shell-page sogp-shell-page pt-3">
        <h1 className="ppc-heading text-lg font-semibold text-zinc-900">
          {title}
        </h1>
      </div>
    </>
  );
}
