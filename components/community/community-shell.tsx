import type { ReactNode } from "react";

import { CommunityTopBar } from "./community-tabs";
import type { DashboardNavItem } from "@/lib/dashboard/navigation";

/**
 * The community's sticky title bar around a page. Its destinations live in
 * the dashboard shell's navigation, so there is no bottom bar or side rail.
 */
export function CommunityShell({
  unitName,
  children,
  navigation,
}: {
  unitName: string | null;
  children: ReactNode;
  navigation?: DashboardNavItem[];
}) {
  return (
    <>
      <CommunityTopBar unitName={unitName} navigation={navigation} />
      <div className="flex-1">{children}</div>
    </>
  );
}
