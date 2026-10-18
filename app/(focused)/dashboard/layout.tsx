import { Suspense } from "react";
import { redirect } from "next/navigation";

import { CommunityQueryProvider } from "@/components/community/community-query-provider";
import { DashboardFrameFallback } from "@/components/dashboard/shell/dashboard-frame-fallback";
import { DashboardShell } from "@/components/dashboard/shell/dashboard-shell";
import { getDashboardViewer } from "@/lib/dashboard/viewer";

/**
 * Focused dashboard routes (the Welcome Pack join step) sit outside the site
 * dashboard layout but share its shell. Pages keep their own guards.
 */
export default function FocusedDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<DashboardFrameFallback />}>
      <FocusedDashboardFrame>{children}</FocusedDashboardFrame>
    </Suspense>
  );
}

async function FocusedDashboardFrame({ children }: { children: React.ReactNode }) {
  const viewer = await getDashboardViewer();

  if (!viewer) {
    redirect(`/login?returnTo=${encodeURIComponent("/dashboard/welcomepack/join")}`);
  }

  return (
    <CommunityQueryProvider key={viewer.session.user.id}>
      <DashboardShell
        viewer={{ name: viewer.session.user.name, roleLabel: viewer.roleLabel, image: viewer.session.user.image }}
        sections={viewer.navigation}
      >
        {children}
      </DashboardShell>
    </CommunityQueryProvider>
  );
}
