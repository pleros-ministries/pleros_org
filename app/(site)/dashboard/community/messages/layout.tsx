import type { ReactNode } from "react";

import { MessagesShell } from "@/components/community/messages/messages-shell";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";

export default async function CommunityMessagesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ctx = await getCommunityContext();

  // Each page guards itself; without community access, skip the inbox shell
  // and let the page's own redirect run.
  if (!ctx || !canAccessCommunity(ctx)) {
    return <>{children}</>;
  }

  return <MessagesShell>{children}</MessagesShell>;
}
