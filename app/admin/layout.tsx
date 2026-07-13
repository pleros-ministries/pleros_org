import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { PpcAppFrame } from "@/components/ppc/ppc-app-frame";
import { QueryProvider } from "@/components/query-provider";
import { getAppSession } from "@/lib/app-session";
export const metadata: Metadata = {
  title: "PPC Admin",
  description: "Pleros Perfecting Courses staff administration",
};

const PUBLIC_ADMIN_PATHS = new Set([
  "/admin/forgot-password",
  "/admin/reset-password",
  "/admin/setup",
]);

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const [session, requestHeaders] = await Promise.all([getAppSession(), headers()]);
  const isPublicAdminPage = PUBLIC_ADMIN_PATHS.has(
    requestHeaders.get("x-pleros-pathname") ?? "",
  );

  if (session?.user.role === "student") {
    redirect("/ppc");
  }

  return (
    <div className="ppc-theme">
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
