"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * The community page grid: the left rail (from `xl`) beside the page. Layouts
 * cannot read the pathname, so this client wrapper sets the page's width. The
 * feed lays out its own right column and messages need the whole width for
 * the inbox and thread; every other page keeps a readable column.
 */
export function CommunityGrid({
  leftRail,
  children,
}: {
  leftRail: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const fullWidth =
    pathname === "/dashboard/community" ||
    pathname.startsWith("/dashboard/community/messages");

  return (
    <div className="mx-auto grid w-full max-w-xl gap-6 lg:max-w-[64rem] lg:items-start xl:max-w-[78rem] xl:grid-cols-[15rem_minmax(0,1fr)]">
      {leftRail}
      <div
        className={
          fullWidth
            ? "min-w-0"
            : "mx-auto w-full min-w-0 max-w-[48rem] xl:mx-0"
        }
      >
        {children}
      </div>
    </div>
  );
}
