import { redirect } from "next/navigation";
import { MessagesSquareIcon } from "lucide-react";

import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";

// Reads the session on every request (Cache Components).
export const instant = false;

export default async function CommunityMessagesRoute() {
  // Session and context load together instead of one roundtrip after the other.
  const [session, ctx] = await Promise.all([getAppSession(), getCommunityContext()]);
  if (!session) redirect("/login?returnTo=/dashboard/community/messages");
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  // The inbox itself lives in the layout; this fills the desktop thread pane.
  return (
    <section className="grid min-h-[26rem] place-items-center rounded-2xl border border-[var(--color-community-edge)] bg-white p-6 text-center">
      <div className="grid justify-items-center gap-2">
        <MessagesSquareIcon
          className="size-8 text-[var(--color-community-muted)]"
          strokeWidth={1.5}
        />
        <p className="text-sm font-medium text-[var(--color-community-ink)]">
          Select a conversation
        </p>
        <p className="max-w-xs text-[13px] text-[var(--color-community-muted)]">
          Private messages are only visible to you and the person you are
          talking to.
        </p>
      </div>
    </section>
  );
}
