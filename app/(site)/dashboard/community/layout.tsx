import type { ReactNode } from "react";

import { CommunityGrid } from "@/components/community/community-grid";
import { CommunityLeftRail } from "@/components/community/community-left-rail";
import { CommunityQueryProvider } from "@/components/community/community-query-provider";
import { CommunitySidebar } from "@/components/community/community-sidebar";
import { CommunityShell } from "@/components/community/community-shell";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { managesAnyUnit } from "@/lib/community/permissions";
import { getDiscipleshipRailSummary } from "@/lib/db/queries/community-discipleship";
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

  const showLeaderTab = managesAnyUnit(ctx);
  const unitId = ctx.unit?.id ?? null;

  const [sidebar, unitCard, discipleship] = await Promise.all([
    getCommunitySidebar(ctx),
    ctx.unit
      ? getUnitRailCard(ctx.unit.id, ctx.enrollmentId)
      : Promise.resolve(null),
    // Discipleship belongs to enrolled learners; admins without one skip it.
    ctx.enrollmentId != null
      ? getDiscipleshipRailSummary(ctx.userId)
      : Promise.resolve(null),
  ]);

  return (
    <CommunityQueryProvider>
      {/* A column so the phone bottom bar rests at the section's end; it brings its own bottom gap. */}
      <section className="site-font-theme flex min-h-screen flex-col bg-[#e8edf7] pb-3 text-zinc-900 lg:pb-16">
        <CommunityShell
          unitCard={unitCard}
          unitId={unitId}
          discipleship={discipleship}
          showLeaderTab={showLeaderTab}
        >
          <div className="site-shell-page sogp-shell-page pb-6 pt-4">
            <CommunityGrid
              leftRail={
                <CommunityLeftRail
                  unitCard={unitCard}
                  unitId={unitId}
                  discipleship={discipleship}
                  showLeaderTab={showLeaderTab}
                  className="hidden xl:block"
                />
              }
              sidebar={<CommunitySidebar data={sidebar} />}
            >
              {children}
            </CommunityGrid>
          </div>
        </CommunityShell>
      </section>
    </CommunityQueryProvider>
  );
}
