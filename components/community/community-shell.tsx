"use client";

import { useState, type ReactNode } from "react";

import type { DiscipleshipRailSummary } from "@/lib/db/queries/community-discipleship";
import type { UnitRailCard } from "@/lib/db/queries/community-units";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { CommunityBottomBar } from "./community-bottom-bar";
import { CommunityRailContent } from "./community-left-rail";
import { CommunityTopBar } from "./community-tabs";

/**
 * The community's navigation chrome around a page: the sticky top bar, the
 * phone bottom bar, and the menu sheet both of them open. Wide screens show
 * the same menu as a side rail instead.
 */
export function CommunityShell({
  unitCard,
  unitId,
  discipleship,
  showLeaderTab,
  children,
}: {
  unitCard: UnitRailCard | null;
  unitId: number | null;
  discipleship: DiscipleshipRailSummary | null;
  showLeaderTab: boolean;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = () => setMenuOpen(true);

  return (
    <>
      <CommunityTopBar unitName={unitCard?.name ?? null} onOpenMenu={openMenu} />

      {/* Fills the section so the bottom bar's resting place is its very end. */}
      <div className="flex-1">{children}</div>

      <CommunityBottomBar onOpenMenu={openMenu} />

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
            discipleship={discipleship}
            showLeaderTab={showLeaderTab}
            onNavigate={() => setMenuOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
