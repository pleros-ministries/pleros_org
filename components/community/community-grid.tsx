"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * The community page grid. Layouts cannot read the pathname, so this client
 * wrapper drops the right sidebar on message routes to give the inbox and
 * thread the full width.
 */
export function CommunityGrid({
  leftRail,
  sidebar,
  children,
}: {
  leftRail: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const wide = pathname.startsWith("/dashboard/community/messages");

  return (
    <div
      className={
        wide
          ? "mx-auto grid w-full max-w-xl gap-6 lg:max-w-[64rem] lg:items-start xl:max-w-[78rem] xl:grid-cols-[15rem_minmax(0,1fr)]"
          : "mx-auto grid w-full max-w-xl gap-6 lg:max-w-[64rem] lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start xl:max-w-[78rem] xl:grid-cols-[15rem_minmax(0,1fr)_18rem]"
      }
    >
      {leftRail}
      <div className="min-w-0">{children}</div>
      {wide ? null : sidebar}
    </div>
  );
}
