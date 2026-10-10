import { redirect } from "next/navigation";

import { CommunityQueryProvider } from "@/components/community/community-query-provider";
import { DashboardShell } from "@/components/dashboard/shell/dashboard-shell";
import { getDashboardViewer } from "@/lib/dashboard/viewer";

/**
 * Focused dashboard routes (the Welcome Pack join step) sit outside the site
 * dashboard layout but share its shell. Pages keep their own guards.
 */
export default async function FocusedDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getDashboardViewer();

  if (!viewer) {
    redirect(`/login?returnTo=${encodeURIComponent("/dashboard/welcomepack/join")}`);
  }

  return (
    <CommunityQueryProvider>
      <DashboardShell
        viewer={{ name: viewer.session.user.name, roleLabel: viewer.roleLabel }}
        sections={viewer.navigation}
      >
        {children}
      </DashboardShell>
    </CommunityQueryProvider>
  );
}
