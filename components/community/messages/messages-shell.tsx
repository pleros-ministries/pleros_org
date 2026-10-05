"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { ConversationList } from "./conversation-list";

const THREAD_PATH = /^\/dashboard\/community\/messages\/(\d+)/;

/**
 * Inbox and thread side by side on desktop; one at a time on smaller screens,
 * chosen by the route.
 */
export function MessagesShell({ children }: { children: ReactNode }) {
  const match = THREAD_PATH.exec(usePathname() ?? "");
  const activeId = match ? Number(match[1]) : null;
  const inThread = activeId != null;

  return (
    <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
      <div className={inThread ? "hidden lg:block" : ""}>
        <ConversationList activeId={activeId} />
      </div>
      <div className={inThread ? "min-w-0" : "hidden min-w-0 lg:block"}>
        {children}
      </div>
    </div>
  );
}
