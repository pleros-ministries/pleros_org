import Link from "next/link";

import { AdminDashboardClient } from "@/components/ppc/admin-dashboard-client";
import { StaffLoginPanel } from "@/components/ppc/staff-login-panel";
import { getAppSession } from "@/lib/app-session";

export default async function AdminEntryPage() {
  const session = await getAppSession();

  if (!session) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
        <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Staff portal
          </p>
          <h1 className="mt-2 ppc-heading text-xl font-semibold text-zinc-950">
            Login
          </h1>

          <StaffLoginPanel />

          <p className="mt-4 text-[11px] text-zinc-400">
            Student access remains at{" "}
            <Link href="/ppc" className="underline">
              /ppc
            </Link>
            .
          </p>
        </section>
      </main>
    );
  }

  return <AdminDashboardClient />;
}
