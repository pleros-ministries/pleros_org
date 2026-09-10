"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import type { UnitRailCard } from "@/lib/db/queries/community-units";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { CommunityRailContent } from "./community-left-rail";
import { NotificationBell } from "./notification-bell";

function useTitle(unitName: string | null): string {
  const pathname = usePathname() ?? "";
  if (pathname.includes("/dashboard/community/leader")) return "Leader";
  if (pathname.includes("/dashboard/community/unit/")) {
    return unitName ?? "Your unit";
  }
  if (pathname.includes("/dashboard/community/post/")) return "Post";
  return "Community";
}

/** The brand-blue sticky sub-header at the top of every community page. */
export function CommunityTopBar({
  unitCard,
  unitId,
  showLeaderTab,
}: {
  unitCard: UnitRailCard | null;
  unitId: number | null;
  showLeaderTab: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const title = useTitle(unitCard?.name ?? null);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-brand-blue)] bg-[var(--color-brand-blue)]">
      <div className="site-shell-page sogp-shell-page flex min-h-12 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open community menu"
            className="-ml-1.5 inline-flex size-9 items-center justify-center rounded-lg text-white/85 transition-colors hover:bg-white/10 hover:text-white xl:hidden"
          >
            <MenuIcon className="size-5" strokeWidth={2} />
          </button>
          <p className="ppc-heading truncate text-base font-semibold text-white">
            {title}
          </p>
        </div>
        <NotificationBell tone="dark" />
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="left"
          className="site-font-theme w-[min(100%,20rem)] overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>Community</SheetTitle>
          </SheetHeader>
          <CommunityRailContent
            unitCard={unitCard}
            unitId={unitId}
            showLeaderTab={showLeaderTab}
            onNavigate={() => setMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </header>
  );
}
