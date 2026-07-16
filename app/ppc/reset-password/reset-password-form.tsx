"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { resetPpcPasswordAction } from "@/app/ppc/_actions/password-reset-actions";
import { INITIAL_PASSWORD_RESET_STATE } from "@/lib/ppc-password-reset";

type ResetPasswordFormProps = {
  token: string;
  description?: string;
  forgotPasswordHref?: string;
  loginHref?: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 h-8 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-brand-blue-hover)] disabled:opacity-50"
    >
      {pending ? "Updating..." : "Update password"}
    </button>
  );
}

export function ResetPasswordForm({
  token,
  description = "Choose a new password for your PPC account.",
  forgotPasswordHref = "/ppc/forgot-password",
  loginHref = "/ppc",
}: ResetPasswordFormProps) {
  const [state, formAction] = useActionState(
    resetPpcPasswordAction,
    INITIAL_PASSWORD_RESET_STATE,
  );

  if (!token) {
    return (
      <div className="mt-4 grid gap-3">
        <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          This reset link is invalid or expired. Request a new link to continue.
        </div>
        <Link
          href={forgotPasswordHref}
          className="inline-flex h-8 items-center justify-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-brand-blue-hover)]"
        >
          Request new link
        </Link>
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div className="mt-4 grid gap-3">
        <div className="rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {state.message}
        </div>
        <Link
          href={loginHref}
          className="inline-flex h-8 items-center justify-center rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-brand-blue-hover)]"
        >
          Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="mt-1 text-xs text-zinc-500">
        {description}
      </p>

      <form action={formAction} className="mt-4 grid gap-3">
        <input type="hidden" name="token" value={token} />

        {state.message ? (
          <div className="rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {state.message}
          </div>
        ) : null}

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            New password
          </span>
          <input
            type="password"
            name="password"
            required
            minLength={8}
            placeholder="Min. 8 characters"
            aria-invalid={Boolean(state.errors.password)}
            aria-describedby={
              state.errors.password ? "reset-password-error" : undefined
            }
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
        </label>

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Confirm password
          </span>
          <input
            type="password"
            name="confirmPassword"
            required
            minLength={8}
            placeholder="Repeat password"
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
        </label>

        {state.errors.password ? (
          <p id="reset-password-error" className="text-xs text-red-700">
            {state.errors.password}
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </>
  );
}
