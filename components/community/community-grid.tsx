"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * The community page column. Layouts cannot read the pathname, so this client
 * wrapper sets the page's width. The feed lays out its own right column and
 * messages need the whole width for the inbox and thread; every other page
 * keeps a readable column.
 */
export function CommunityGrid({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  if (pathname === "/dashboard/community") return <div className="min-w-0">{children}</div>;
  const fullWidth =
    pathname === "/dashboard/community/feed" ||
    pathname.startsWith("/dashboard/community/messages");

  return (
    <div className="site-shell-page sogp-shell-page pb-10 pt-4">
      <div className="mx-auto w-full max-w-xl lg:max-w-[64rem] xl:max-w-[72rem]">
        <div className={fullWidth ? "min-w-0" : "mx-auto w-full min-w-0 max-w-[48rem]"}>
          {children}
        </div>
      </div>
    </div>
  );
}
