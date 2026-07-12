import { PpcAuthShell } from "@/components/ppc/ppc-auth-shell";

import { ResetPasswordForm } from "./reset-password-form";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
    error?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.error ? "" : (params.token ?? "");

  return (
    <PpcAuthShell>
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Student portal
        </p>
        <h1 className="mt-2 ppc-heading text-xl font-semibold text-zinc-950">
          Set new password
        </h1>

        <ResetPasswordForm token={token} />
      </section>
    </PpcAuthShell>
  );
}
