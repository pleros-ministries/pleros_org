"use client";

import type { ReactNode } from "react";

import { CommunityTopBar } from "./community-tabs";

/**
 * The community's sticky title bar around a page. Its destinations live in
 * the dashboard shell's navigation, so there is no bottom bar or side rail.
 */
export function CommunityShell({
  unitName,
  children,
}: {
  unitName: string | null;
  children: ReactNode;
}) {
  return (
    <>
      <CommunityTopBar unitName={unitName} />
      <div className="flex-1">{children}</div>
    </>
  );
}
