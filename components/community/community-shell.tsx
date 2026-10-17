import type { ReactNode } from "react";

import { CommunityBottomBar } from "./community-bottom-bar";
import type { DashboardNavItem } from "@/lib/dashboard/navigation";

/**
 * The page plus the five main Community destinations: a grounded bottom bar on
 * phones and tablets, a slim top strip from `lg`. The old title bar and its
 * section switcher are retired (Pastor review, 17 October); every destination
 * it listed is reachable from this bar or the Community home, and each deep
 * page carries its own heading or back link.
 */
export function CommunityShell({
  children,
}: {
  /** Kept for callers; the retired title bar used them. */
  unitName?: string | null;
  children: ReactNode;
  navigation?: DashboardNavItem[];
}) {
  return (
    <>
      <CommunityBottomBar placement="top" />
      <div className="flex-1">{children}</div>
      <CommunityBottomBar />
    </>
  );
}
