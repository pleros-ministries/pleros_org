import Link from "next/link";
import { redirect } from "next/navigation";

import { SuperAdminPasswordSetupForm } from "@/components/ppc/super-admin-password-setup-form";
import { getAppSession } from "@/lib/app-session";
import { getMissingSuperAdminEmails, isConfiguredSuperAdminEmail } from "@/lib/app-user";
import { getSuperAdminSetupClaimByToken } from "@/lib/db/queries/super-admin-setup";
import { getSuperAdminSetupClaimStatus } from "@/lib/super-admin-setup";

type SuperAdminSetupClaimPageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function SuperAdminSetupClaimPage({
  params,
}: SuperAdminSetupClaimPageProps) {
  const [{ token }, session] = await Promise.all([params, getAppSession()]);

  if (session?.user.role === "student") {
    redirect("/ppc");
  }

  if (session) {
    redirect("/admin");
  }

  const claim = await getSuperAdminSetupClaimByToken(token);
  const status = claim ? getSuperAdminSetupClaimStatus(claim) : null;
  const missingSuperAdminEmails = claim ? await getMissingSuperAdminEmails() : [];
  const isEligibleClaim =
    claim &&
    status === "pending" &&
    isConfiguredSuperAdminEmail(claim.email) &&
    missingSuperAdminEmails.some((email) => email === claim.email);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          PPC super admin
        </p>
        <h1 className="mt-2 ppc-heading text-xl font-semibold text-zinc-950">
          Create your password
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          This secure link confirms access to the configured inbox. Create the
          password to finish setup.
        </p>

        {!isEligibleClaim ? (
          <div className="mt-4 grid gap-3">
            <div className="rounded-sm border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              This setup link is {status ?? "invalid"}. Request a new setup
              email if the super admin account has not been created.
            </div>
            <Link
              href="/admin/setup"
              className="inline-flex h-8 items-center justify-center rounded-sm border border-zinc-200 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Back to setup
            </Link>
          </div>
        ) : (
          <SuperAdminPasswordSetupForm
            token={token}
            email={claim.email}
            name={claim.name}
          />
        )}
      </section>
    </main>
  );
}
