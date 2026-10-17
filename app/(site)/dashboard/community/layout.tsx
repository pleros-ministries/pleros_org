import type { ReactNode } from "react";

import { CommunityGrid } from "@/components/community/community-grid";
import { CommunityShell } from "@/components/community/community-shell";
import {
  canAccessCommunity,
  getCommunityContext,
} from "@/lib/community/context";
import { getDashboardViewer } from "@/lib/dashboard/viewer";

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
  const viewer = await getDashboardViewer();
  const navigation = viewer?.navigation.find(section=>section.key === "community")?.items ?? [];
  const oversightHref = viewer?.navigation.find(section => section.key === "oversight")?.items.find(item => item.key === "church")?.href ?? null;
  return (
    <section className="flex min-h-[calc(100dvh-var(--dashboard-topbar-offset,0px))] flex-col bg-[var(--color-community-canvas)] text-(--color-text-strong)">
      <CommunityShell unitName={ctx.unit?.name ?? null} navigation={navigation} oversightHref={oversightHref}>
        <CommunityGrid>{children}</CommunityGrid>
      </CommunityShell>
    </section>
  );
}
