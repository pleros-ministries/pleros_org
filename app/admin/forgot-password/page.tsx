import { ForgotPasswordForm } from "@/app/ppc/forgot-password/forgot-password-form";

export default function AdminForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Staff portal
        </p>
        <h1 className="mt-2 ppc-heading text-xl font-semibold text-zinc-950">
          Reset password
        </h1>

        <ForgotPasswordForm
          description="Enter your staff account email and we'll send a password reset link."
          loginHref="/admin"
          resetRedirectPath="/admin/reset-password"
        />
      </section>
    </main>
  );
}
