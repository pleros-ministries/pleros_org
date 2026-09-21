import type { ReactNode } from "react";

import { CommunityLeftRail } from "@/components/community/community-left-rail";
import { CommunityQueryProvider } from "@/components/community/community-query-provider";
import { CommunitySidebar } from "@/components/community/community-sidebar";
import { CommunityTopBar } from "@/components/community/community-tabs";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { getCommunitySidebar } from "@/lib/db/queries/community-posts";
import { getUnitRailCard } from "@/lib/db/queries/community-units";

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

  const showLeaderTab = ctx.isUnitLeader || ctx.isAdmin;
  const unitId = ctx.unit?.id ?? null;

  const [sidebar, unitCard] = await Promise.all([
    getCommunitySidebar(ctx),
    ctx.unit
      ? getUnitRailCard(ctx.unit.id, ctx.enrollmentId)
      : Promise.resolve(null),
  ]);

  return (
    <CommunityQueryProvider>
      <section className="site-font-theme min-h-screen bg-[#e8edf7] pb-16 text-zinc-900">
        <CommunityTopBar
          unitCard={unitCard}
          unitId={unitId}
          showLeaderTab={showLeaderTab}
        />

        <div className="site-shell-page sogp-shell-page pb-6 pt-4">
          <div className="mx-auto grid w-full max-w-xl gap-6 lg:max-w-[64rem] lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start xl:max-w-[78rem] xl:grid-cols-[15rem_minmax(0,1fr)_18rem]">
            <CommunityLeftRail
              unitCard={unitCard}
              unitId={unitId}
              showLeaderTab={showLeaderTab}
              className="hidden xl:block"
            />

            <div className="min-w-0">{children}</div>

            <CommunitySidebar data={sidebar} />
          </div>
        </div>
      </section>
    </CommunityQueryProvider>
  );
}
