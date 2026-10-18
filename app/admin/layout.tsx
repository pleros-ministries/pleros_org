import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PpcAppFrame } from "@/components/ppc/ppc-app-frame";
import { QueryProvider } from "@/components/query-provider";
import { getAppSession } from "@/lib/app-session";
import { getChurchAssignment } from "@/lib/db/queries/church-organisation";
import { dashboardFont } from "@/components/dashboard/v3/font";

// Cache Components: Staff console: not adopted yet (docs/dashboard-demo/CACHE_COMPONENTS_PLAN.md).
export const instant = false;
export const metadata: Metadata = {
  title: "Pleros Admin",
  description: "Pleros operations and administration",
};

const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/forgot-password",
  "/admin/reset-password",
  "/admin/setup",
]);

function isPublicAdminPath(pathname: string) {
  return (
    PUBLIC_ADMIN_PATHS.has(pathname) ||
    pathname.startsWith("/admin/setup/claim/")
  );
}

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const [session, requestHeaders] = await Promise.all([getAppSession(), headers()]);
  const isPublicAdminPage = isPublicAdminPath(
    requestHeaders.get("x-pleros-pathname") ?? "",
  );

  const churchAssignment = session
    ? await getChurchAssignment(session.user.id)
    : null;
  const isChurchAdmin =
    churchAssignment?.role === "pastor" ||
    churchAssignment?.role === "branch_pastor";

  if (session?.user.role === "student" && !isChurchAdmin) {
    redirect("/ppc");
  }

  return (
    <div
      className={`ppc-theme ${dashboardFont.className} ${dashboardFont.variable}`}
      data-admin-v3
    >
      {session && !isPublicAdminPage ? (
        <QueryProvider userId={session.user.id}>
          <PpcAppFrame session={session}>{children}</PpcAppFrame>
        </QueryProvider>
      ) : (
        children
      )}
    </div>
  );
}
