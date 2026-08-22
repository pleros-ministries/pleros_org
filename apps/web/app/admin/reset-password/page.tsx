import { ResetPasswordForm } from "@/app/ppc/reset-password/reset-password-form";

type AdminResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
    error?: string;
  }>;
};

export default async function AdminResetPasswordPage({
  searchParams,
}: AdminResetPasswordPageProps) {
  const params = await searchParams;
  const token = params.error ? "" : (params.token ?? "");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-5 py-10">
      <section className="w-full rounded-sm border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Staff portal
        </p>
        <h1 className="mt-2 ppc-heading text-xl font-semibold text-zinc-950">
          Set new password
        </h1>

        <ResetPasswordForm
          token={token}
          description="Choose a new password for your staff account."
          forgotPasswordHref="/admin/forgot-password"
          loginHref="/admin"
        />
      </section>
    </main>
  );
}
