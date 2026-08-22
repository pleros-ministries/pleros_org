import { PpcAuthShell } from "@/components/ppc/ppc-auth-shell";

import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <PpcAuthShell>
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Student portal
        </p>
        <h1 className="mt-2 ppc-heading text-xl font-semibold text-zinc-950">
          Reset password
        </h1>

        <ForgotPasswordForm />
      </section>
    </PpcAuthShell>
  );
}
