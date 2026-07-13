import { redirect } from "next/navigation";

import { SuperAdminSetupForm } from "@/components/ppc/super-admin-setup-form";
import { getAppSession } from "@/lib/app-session";
import { getMissingSuperAdminEmails } from "@/lib/app-user";

export default async function AdminSetupPage() {
  const session = await getAppSession();
  const missingSuperAdminEmails = await getMissingSuperAdminEmails();

  if (session?.user.role === "student") {
    redirect("/ppc");
  }

  if (session || missingSuperAdminEmails.length === 0) {
    redirect("/admin");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          PPC super admin
        </p>
        <h1 className="mt-2 ppc-heading text-xl font-semibold text-zinc-950">
          Create the first admin
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          This page is only available for configured super admin accounts that
          have not been created yet.
        </p>

        <SuperAdminSetupForm emails={missingSuperAdminEmails} />
      </section>
    </main>
  );
}
