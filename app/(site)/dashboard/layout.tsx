import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { CommunityQueryProvider } from "@/components/community/community-query-provider";
import { DashboardShell } from "@/components/dashboard/shell/dashboard-shell";
import { PushBindingSync } from "@/components/push/push-binding-sync";
import { recordDashboardVisit } from "@/lib/db/queries/admin-analytics";
import { getDashboardViewer } from "@/lib/dashboard/viewer";
import { normalizeLearnerReturnTo } from "@/lib/sogp/auth-flow";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pleros-pathname") ?? "/dashboard";
  const returnTo = normalizeLearnerReturnTo(pathname);
  // getAppSession() underneath; null means no full Better Auth app session.
  const viewer = await getDashboardViewer();

  if (!viewer) {
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  // Analytics must never slow navigation: the visit is recorded after the response.
  after(() =>
    recordDashboardVisit({
      visitorKey: viewer.session.user.id,
      visitorType: "user",
    }).catch(() => undefined),
  );

  // One query client for the shell's unread badges and the community pages,
  // so a read message clears both. SOGP routes nest their own provider.
  return (
    <CommunityQueryProvider key={viewer.session.user.id}>
      <PushBindingSync userId={viewer.session.user.id} />
      <DashboardShell
        viewer={{ name: viewer.session.user.name, roleLabel: viewer.roleLabel, image: viewer.session.user.image }}
        sections={viewer.navigation}
      >
        {children}
      </DashboardShell>
    </CommunityQueryProvider>
  );
}
