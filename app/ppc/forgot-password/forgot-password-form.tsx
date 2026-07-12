"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { requestPpcPasswordResetAction } from "@/app/ppc/_actions/password-reset-actions";
import { INITIAL_PASSWORD_RESET_REQUEST_STATE } from "@/lib/ppc-password-reset";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-1 h-8 rounded-sm bg-[var(--color-brand-blue)] px-3 text-xs font-semibold text-white hover:bg-[var(--color-brand-blue-hover)] disabled:opacity-50"
    >
      {pending ? "Sending..." : "Send reset link"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    requestPpcPasswordResetAction,
    INITIAL_PASSWORD_RESET_REQUEST_STATE,
  );

  return (
    <>
      <p className="mt-1 text-xs text-zinc-500">
        Enter your PPC account email and we&apos;ll send a password reset link.
      </p>

      <form action={formAction} className="mt-4 grid gap-3">
        {state.message ? (
          <div
            className={
              state.status === "success"
                ? "rounded-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
                : "rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            }
          >
            {state.message}
          </div>
        ) : null}

        <label className="grid gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            defaultValue={state.values.email}
            placeholder="you@example.com"
            aria-invalid={Boolean(state.errors.email)}
            aria-describedby={state.errors.email ? "reset-email-error" : undefined}
            className="h-8 rounded-sm border border-zinc-300 px-2.5 text-xs outline-none focus:border-zinc-700"
          />
        </label>

        {state.errors.email ? (
          <p id="reset-email-error" className="text-xs text-red-700">
            {state.errors.email}
          </p>
        ) : null}

        <SubmitButton />
      </form>

      <p className="mt-4 text-center text-[11px] text-zinc-500">
        Remembered it?{" "}
        <Link
          href="/ppc"
          className="font-medium text-zinc-900 underline-offset-2 hover:underline"
        >
          Login
        </Link>
      </p>
    </>
  );
}
