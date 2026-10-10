import type { ReactNode } from "react";

import { CommunityGrid } from "@/components/community/community-grid";
import { CommunityShell } from "@/components/community/community-shell";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";

export default async function CommunityLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ctx = await getCommunityContext();

  // Each community route guards itself (login with returnTo, or /sogp/enrol).
  // When the viewer can't see community at all, skip the shell and let the
  // page's own redirect run.
  if (!ctx || !canAccessCommunity(ctx)) {
    return <>{children}</>;
  }

  // Navigation, unread badges and the shared query client come from the
  // dashboard layout; this keeps only the community's title bar.
  return (
    <section className="site-font-theme flex min-h-[calc(100dvh-var(--dashboard-topbar-offset,0px))] flex-col bg-[#e8edf7] text-zinc-900">
      <CommunityShell unitName={ctx.unit?.name ?? null}>
        <div className="site-shell-page sogp-shell-page pb-10 pt-4">
          <CommunityGrid>{children}</CommunityGrid>
        </div>
      </CommunityShell>
    </section>
  );
}
