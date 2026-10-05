import { redirect } from "next/navigation";
import { MessagesSquareIcon } from "lucide-react";

import { getAppSession } from "@/lib/app-session";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";

export default async function CommunityMessagesRoute() {
  const session = await getAppSession();
  if (!session) redirect("/login?returnTo=/dashboard/community/messages");

  const ctx = await getCommunityContext();
  if (!ctx || !canAccessCommunity(ctx)) redirect("/sogp/enrol");

  // The inbox itself lives in the layout; this fills the desktop thread pane.
  return (
    <section className="grid min-h-[26rem] place-items-center rounded-2xl border border-(--color-line-strong) bg-white p-6 text-center shadow-(--shadow-sm)">
      <div className="grid justify-items-center gap-2">
        <MessagesSquareIcon
          className="size-8 text-zinc-300"
          strokeWidth={1.5}
        />
        <p className="text-sm font-medium text-zinc-700">
          Select a conversation
        </p>
        <p className="max-w-xs text-[13px] text-zinc-500">
          Private messages are only visible to you and the person you are
          talking to.
        </p>
      </div>
    </section>
  );
}
